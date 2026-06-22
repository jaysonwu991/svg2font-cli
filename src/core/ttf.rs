use crate::core::glyphs::GlyphMeta;
use crate::{Error, Result, DEFAULT_ASCENT, DEFAULT_UNITS_PER_EM};
use font_types::{GlyphId, NameId, Tag, Version16Dot16};
use kurbo::{cubics_to_quadratic_splines, Affine, BezPath, CubicBez, ParamCurve, PathEl, Point};
use write_fonts::{
    tables::{
        cmap::Cmap,
        glyf::{GlyfLocaBuilder, Glyph, SimpleGlyph},
        head::Head,
        hhea::Hhea,
        hmtx::{Hmtx, LongMetric},
        maxp::Maxp,
        name::{Name, NameRecord},
        os2::Os2,
        post::Post,
    },
    FontBuilder,
};

const ADVANCE_WIDTH: u16 = 1024;
const CUBIC_ACCURACY: f64 = 1.0;

pub fn create_ttf(glyphs: &[GlyphMeta], font_name: &str) -> Result<Vec<u8>> {
    let num_glyphs = glyphs.len() + 1; // +1 for .notdef (GID 0)

    // --- glyf + loca ---
    let mut glyf_builder = GlyfLocaBuilder::new();
    glyf_builder
        .add_glyph(&Glyph::Simple(SimpleGlyph::default()))
        .map_err(|e| Error::FontGeneration(format!(".notdef: {e:?}")))?;

    for glyph in glyphs {
        let bezpath = svg_to_bezpath(glyph)?;
        let simple = if bezpath.elements().is_empty() {
            SimpleGlyph::default()
        } else {
            SimpleGlyph::from_bezpath(&bezpath)
                .map_err(|e| Error::FontGeneration(format!("glyph '{}': {e:?}", glyph.name)))?
        };
        glyf_builder
            .add_glyph(&Glyph::Simple(simple))
            .map_err(|e| Error::FontGeneration(format!("glyph '{}': {e:?}", glyph.name)))?;
    }
    let (glyf, loca, loca_format) = glyf_builder.build();

    // --- head ---
    let head = Head {
        font_revision: Default::default(),
        checksum_adjustment: 0,
        magic_number: 0x5F0F3CF5,
        flags: Default::default(),
        units_per_em: DEFAULT_UNITS_PER_EM as u16,
        created: Default::default(),
        modified: Default::default(),
        x_min: 0,
        y_min: -128,
        x_max: ADVANCE_WIDTH as i16,
        y_max: DEFAULT_ASCENT as i16,
        mac_style: Default::default(),
        lowest_rec_ppem: 8,
        font_direction_hint: 2,
        index_to_loc_format: loca_format as i16,
    };

    // --- hhea ---
    let hhea = Hhea {
        ascender: (DEFAULT_ASCENT as i16).into(),
        descender: (-128i16).into(),
        line_gap: 0.into(),
        advance_width_max: ADVANCE_WIDTH.into(),
        min_left_side_bearing: 0.into(),
        min_right_side_bearing: 0.into(),
        x_max_extent: (ADVANCE_WIDTH as i16).into(),
        caret_slope_rise: 1,
        caret_slope_run: 0,
        caret_offset: 0,
        number_of_h_metrics: num_glyphs as u16,
    };

    // --- maxp ---
    let maxp = Maxp::new(num_glyphs as u16);

    // --- hmtx ---
    let metrics: Vec<LongMetric> = (0..num_glyphs)
        .map(|_| LongMetric {
            advance: ADVANCE_WIDTH,
            side_bearing: 0,
        })
        .collect();
    let hmtx = Hmtx::new(metrics, vec![]);

    // --- OS/2 ---
    let first_cp = glyphs.first().map(|g| g.codepoint as u16).unwrap_or(0xE001);
    let last_cp = glyphs.last().map(|g| g.codepoint as u16).unwrap_or(0xE001);
    let os2 = Os2 {
        x_avg_char_width: (ADVANCE_WIDTH / 2) as i16,
        us_weight_class: 400,
        us_width_class: 5,
        fs_type: 0,
        y_subscript_x_size: 0,
        y_subscript_y_size: 0,
        y_subscript_x_offset: 0,
        y_subscript_y_offset: 0,
        y_superscript_x_size: 0,
        y_superscript_y_size: 0,
        y_superscript_x_offset: 0,
        y_superscript_y_offset: 0,
        y_strikeout_size: 0,
        y_strikeout_position: 0,
        s_family_class: 0,
        panose_10: Default::default(),
        ul_unicode_range_1: 0,
        ul_unicode_range_2: 0,
        ul_unicode_range_3: 0,
        ul_unicode_range_4: 0,
        ach_vend_id: Tag::new(b"NONE"),
        fs_selection: Default::default(),
        us_first_char_index: first_cp,
        us_last_char_index: last_cp,
        s_typo_ascender: DEFAULT_ASCENT as i16,
        s_typo_descender: -128,
        s_typo_line_gap: 0,
        us_win_ascent: DEFAULT_ASCENT as u16,
        us_win_descent: 128,
        ul_code_page_range_1: Some(0),
        ul_code_page_range_2: Some(0),
        sx_height: Some(0),
        s_cap_height: Some(DEFAULT_ASCENT as i16),
        us_default_char: Some(0),
        us_break_char: Some(0x0020),
        us_max_context: Some(1),
        us_lower_optical_point_size: None,
        us_upper_optical_point_size: None,
    };

    // --- name ---
    let name = build_name_table(font_name);

    // --- cmap ---
    let mappings: Vec<(char, GlyphId)> = glyphs
        .iter()
        .enumerate()
        .filter_map(|(i, g)| char::from_u32(g.codepoint).map(|c| (c, GlyphId::new((i + 1) as u32))))
        .collect();
    let cmap =
        Cmap::from_mappings(mappings).map_err(|e| Error::FontGeneration(format!("cmap: {e}")))?;

    // --- post v3 ---
    let post = Post {
        version: Version16Dot16::VERSION_3_0,
        italic_angle: Default::default(),
        underline_position: (-75i16).into(),
        underline_thickness: 50i16.into(),
        is_fixed_pitch: 0,
        min_mem_type42: 0,
        max_mem_type42: 0,
        min_mem_type1: 0,
        max_mem_type1: 0,
        num_glyphs: None,
        glyph_name_index: None,
        string_data: None,
    };

    let bytes = FontBuilder::new()
        .add_table(&head)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&hhea)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&maxp)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&os2)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&name)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&cmap)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&post)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&hmtx)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&loca)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .add_table(&glyf)
        .map_err(|e| Error::FontGeneration(e.to_string()))?
        .build();

    Ok(bytes)
}

fn build_name_table(font_name: &str) -> Name {
    let ps_name = font_name.replace(' ', "-");
    let full_name = format!("{font_name} Regular");
    let mut records = vec![
        NameRecord {
            platform_id: 3,
            encoding_id: 1,
            language_id: 0x0409,
            name_id: NameId::FAMILY_NAME,
            string: font_name.to_string().into(),
        },
        NameRecord {
            platform_id: 3,
            encoding_id: 1,
            language_id: 0x0409,
            name_id: NameId::SUBFAMILY_NAME,
            string: "Regular".to_string().into(),
        },
        NameRecord {
            platform_id: 3,
            encoding_id: 1,
            language_id: 0x0409,
            name_id: NameId::FULL_NAME,
            string: full_name.into(),
        },
        NameRecord {
            platform_id: 3,
            encoding_id: 1,
            language_id: 0x0409,
            name_id: NameId::POSTSCRIPT_NAME,
            string: ps_name.into(),
        },
    ];
    records.sort();
    Name {
        name_record: records,
        lang_tag_record: None,
    }
}

/// Convert a glyph's SVG to a kurbo BezPath in TTF coordinate space.
///
/// usvg bakes the SVG's width/height → viewBox scale into abs_transform, so paths
/// are in rendered-pixel space (e.g. 0–200 for a 200×200 SVG). We normalize to the
/// em square (1024×1024) then flip Y (SVG Y-down → TTF Y-up).
fn svg_to_bezpath(glyph: &GlyphMeta) -> Result<BezPath> {
    let opt = usvg::Options::default();
    let tree = usvg::Tree::from_data(glyph.svg.as_bytes(), &opt)
        .map_err(|e| Error::SvgParse(format!("glyph '{}': {e}", glyph.name)))?;

    let mut bezpath = BezPath::new();
    walk_group(tree.root(), &mut bezpath);

    if bezpath.elements().is_empty() {
        return Ok(bezpath);
    }

    // Scale from rendered SVG size to the font's em square (1024×1024).
    // usvg applies the viewBox-to-viewport mapping into abs_transform, so paths returned
    // by walk_group are in rendered pixel space (e.g. 0-200 for width="200").
    // tree.size() gives the rendered viewport dimensions, which is the correct reference.
    let svg_w = tree.size().width() as f64;
    let svg_h = tree.size().height() as f64;
    let em = DEFAULT_UNITS_PER_EM as f64;
    let scale_x = em / svg_w;
    let scale_y = em / svg_h;
    // Scale to em square, then flip Y: y_ttf = em - y_svg_scaled
    // Use em (unitsPerEm=1024) as the Y-flip reference, matching TS: normalizedY = height - y
    let normalize = Affine::scale_non_uniform(scale_x, -scale_y).then_translate((0.0, em).into());
    bezpath = normalize * bezpath;

    // Convert any cubic segments to quadratic (TrueType glyf only supports quadratics)
    bezpath = cubics_to_quads(bezpath)?;

    // TrueType winding: outer contours must be CW (negative signed area in Y-up space),
    // inner contours (holes) must be CCW (positive signed area). Enforce this by sorting
    // contours by absolute area (largest = outermost) and setting direction accordingly.
    bezpath = fix_contour_winding(bezpath);

    Ok(bezpath)
}

fn walk_group(group: &usvg::Group, path: &mut BezPath) {
    for node in group.children() {
        match node {
            usvg::Node::Path(p) => collect_path(p, path),
            usvg::Node::Group(g) => walk_group(g, path),
            _ => {}
        }
    }
}

fn collect_path(usvg_path: &usvg::Path, out: &mut BezPath) {
    let t = usvg_path.abs_transform();
    let affine = Affine::new([
        t.sx as f64,
        t.ky as f64,
        t.kx as f64,
        t.sy as f64,
        t.tx as f64,
        t.ty as f64,
    ]);

    for seg in usvg_path.data().segments() {
        use usvg::tiny_skia_path::PathSegment;
        match seg {
            PathSegment::MoveTo(p) => {
                out.move_to(affine * Point::new(p.x as f64, p.y as f64));
            }
            PathSegment::LineTo(p) => {
                out.line_to(affine * Point::new(p.x as f64, p.y as f64));
            }
            PathSegment::QuadTo(p1, p2) => {
                out.quad_to(
                    affine * Point::new(p1.x as f64, p1.y as f64),
                    affine * Point::new(p2.x as f64, p2.y as f64),
                );
            }
            PathSegment::CubicTo(p1, p2, p3) => {
                out.curve_to(
                    affine * Point::new(p1.x as f64, p1.y as f64),
                    affine * Point::new(p2.x as f64, p2.y as f64),
                    affine * Point::new(p3.x as f64, p3.y as f64),
                );
            }
            PathSegment::Close => out.close_path(),
        }
    }
}

/// Convert all cubic bezier segments in a BezPath to quadratic approximations.
fn cubics_to_quads(path: BezPath) -> Result<BezPath> {
    // Fast path: no cubics present
    if !path
        .elements()
        .iter()
        .any(|e| matches!(e, PathEl::CurveTo(..)))
    {
        return Ok(path);
    }

    let mut result = BezPath::new();
    // Process contour by contour (split on MoveTo)
    let mut contour: Vec<PathEl> = Vec::new();

    let flush = |result: &mut BezPath, contour: &mut Vec<PathEl>| -> Result<()> {
        if contour.is_empty() {
            return Ok(());
        }
        // Collect all cubic runs in this contour to batch-convert them
        // Strategy: emit non-cubic elements directly; for runs of consecutive cubics,
        // batch-convert with cubics_to_quadratic_splines, falling back per-cubic otherwise.
        let mut i = 0;
        while i < contour.len() {
            match contour[i] {
                PathEl::MoveTo(p) => {
                    result.move_to(p);
                    i += 1;
                }
                PathEl::LineTo(p) => {
                    result.line_to(p);
                    i += 1;
                }
                PathEl::QuadTo(p1, p2) => {
                    result.quad_to(p1, p2);
                    i += 1;
                }
                PathEl::ClosePath => {
                    result.close_path();
                    i += 1;
                }
                PathEl::CurveTo(_, _, _) => {
                    // Collect consecutive cubics starting from previous on-curve point
                    let start = last_point(result);
                    let mut cubics: Vec<CubicBez> = Vec::new();
                    let mut j = i;
                    while j < contour.len() {
                        if let PathEl::CurveTo(p1, p2, p3) = contour[j] {
                            let from = if j == i {
                                start
                            } else {
                                if let PathEl::CurveTo(_, _, p) = contour[j - 1] {
                                    p
                                } else {
                                    start
                                }
                            };
                            cubics.push(CubicBez::new(from, p1, p2, p3));
                            j += 1;
                        } else {
                            break;
                        }
                    }

                    // Batch convert
                    if let Some(splines) = cubics_to_quadratic_splines(&cubics, CUBIC_ACCURACY) {
                        for spline in &splines {
                            emit_quad_spline(result, spline);
                        }
                    } else {
                        // Fallback: approximate each cubic individually
                        for cubic in &cubics {
                            approx_cubic_as_quads(result, cubic);
                        }
                    }
                    i = j;
                }
            }
        }
        contour.clear();
        Ok(())
    };

    for &el in path.elements() {
        if matches!(el, PathEl::MoveTo(_)) {
            flush(&mut result, &mut contour)?;
        }
        contour.push(el);
    }
    flush(&mut result, &mut contour)?;

    Ok(result)
}

/// Emit quadratic bezier segments from a QuadSpline into a BezPath.
///
/// A QuadSpline stores points where interior on-curve points are implied
/// as midpoints between consecutive off-curve controls.
fn emit_quad_spline(path: &mut BezPath, spline: &kurbo::QuadSpline) {
    let pts = spline.points();
    if pts.len() < 2 {
        return;
    }
    // pts[0] is on-curve start (already the current point — we skip it)
    // pts[1..n-1] are off-curve
    // pts[n-1] is on-curve end
    let n = pts.len();
    let mut i = 1;
    while i < n {
        if i + 1 < n {
            let off = pts[i];
            // Check if next point is the final on-curve or needs an implied midpoint
            if i + 2 == n {
                // pts[i] off-curve, pts[i+1] on-curve (explicit)
                path.quad_to(off, pts[i + 1]);
                i += 2;
            } else {
                // pts[i] off-curve, pts[i+1] also off-curve → implied on-curve at midpoint
                let implied =
                    Point::new((off.x + pts[i + 1].x) / 2.0, (off.y + pts[i + 1].y) / 2.0);
                path.quad_to(off, implied);
                i += 1;
            }
        } else {
            // Shouldn't happen in a well-formed spline, but be safe
            path.line_to(pts[i]);
            i += 1;
        }
    }
}

/// Approximate a cubic bezier as two quadratic beziers (midpoint subdivision).
fn approx_cubic_as_quads(path: &mut BezPath, c: &CubicBez) {
    // Split at t=0.5 and approximate each half as a single quadratic
    let mid = c.eval(0.5);
    let left_ctrl = Point::new(
        0.75 * (c.p1.x + c.p2.x) / 2.0 + 0.25 * (c.p0.x + mid.x) / 2.0,
        0.75 * (c.p1.y + c.p2.y) / 2.0 + 0.25 * (c.p0.y + mid.y) / 2.0,
    );
    let right_ctrl = Point::new(
        0.75 * (c.p1.x + c.p2.x) / 2.0 + 0.25 * (mid.x + c.p3.x) / 2.0,
        0.75 * (c.p1.y + c.p2.y) / 2.0 + 0.25 * (mid.y + c.p3.y) / 2.0,
    );
    path.quad_to(left_ctrl, mid);
    path.quad_to(right_ctrl, c.p3);
}

fn last_point(path: &BezPath) -> Point {
    path.elements()
        .iter()
        .rev()
        .find_map(|el| match el {
            PathEl::MoveTo(p) | PathEl::LineTo(p) => Some(*p),
            PathEl::QuadTo(_, p) => Some(*p),
            PathEl::CurveTo(_, _, p) => Some(*p),
            PathEl::ClosePath => None,
        })
        .unwrap_or(Point::ORIGIN)
}

/// Split a BezPath into individual closed contours.
fn split_contours(path: &BezPath) -> Vec<BezPath> {
    let mut contours: Vec<BezPath> = Vec::new();
    let mut current = BezPath::new();
    for &el in path.elements() {
        if matches!(el, PathEl::MoveTo(_)) && !current.elements().is_empty() {
            contours.push(current);
            current = BezPath::new();
        }
        current.push(el);
    }
    if !current.elements().is_empty() {
        contours.push(current);
    }
    contours
}

/// Compute the signed area of a BezPath contour using the shoelace formula.
/// Positive = counter-clockwise (in standard math / TTF Y-up space).
/// Negative = clockwise.
fn signed_area(path: &BezPath) -> f64 {
    let mut area = 0.0;
    let mut prev = Point::ORIGIN;
    let mut start = Point::ORIGIN;
    for el in path.elements() {
        match el {
            PathEl::MoveTo(p) => {
                prev = *p;
                start = *p;
            }
            PathEl::LineTo(p) => {
                area += (prev.x - p.x) * (prev.y + p.y);
                prev = *p;
            }
            PathEl::QuadTo(p1, p2) => {
                // Approximate with two line segments through the control point
                area += (prev.x - p1.x) * (prev.y + p1.y);
                area += (p1.x - p2.x) * (p1.y + p2.y);
                prev = *p2;
            }
            PathEl::ClosePath => {
                area += (prev.x - start.x) * (prev.y + start.y);
            }
            _ => {}
        }
    }
    area / 2.0
}

/// Reverse a closed contour's winding direction.
fn reverse_contour(path: &BezPath) -> BezPath {
    reverse_bezpath_contour(path)
}

fn reverse_bezpath_contour(path: &BezPath) -> BezPath {
    // Extract all the draw operations as (from, to, kind) segments
    // then rebuild in reverse order
    #[derive(Clone)]
    enum Seg {
        Line(Point, Point),
        Quad(Point, Point, Point), // from, ctrl, to
    }

    let mut segments: Vec<Seg> = Vec::new();
    let mut cur = Point::ORIGIN;
    let mut start = Point::ORIGIN;
    let mut has_close = false;

    for &el in path.elements() {
        match el {
            PathEl::MoveTo(p) => {
                cur = p;
                start = p;
            }
            PathEl::LineTo(p) => {
                segments.push(Seg::Line(cur, p));
                cur = p;
            }
            PathEl::QuadTo(p1, p2) => {
                segments.push(Seg::Quad(cur, p1, p2));
                cur = p2;
            }
            PathEl::ClosePath => {
                if cur != start {
                    segments.push(Seg::Line(cur, start));
                }
                has_close = true;
            }
            _ => {}
        }
    }

    let mut result = BezPath::new();
    if segments.is_empty() {
        return result;
    }

    // Start at the end of the last segment
    let last_pt = match segments.last().unwrap() {
        Seg::Line(_, to) => *to,
        Seg::Quad(_, _, to) => *to,
    };
    result.move_to(last_pt);

    for seg in segments.iter().rev() {
        match seg {
            Seg::Line(from, _) => result.line_to(*from),
            Seg::Quad(from, ctrl, _) => result.quad_to(*ctrl, *from),
        }
    }
    if has_close {
        result.close_path();
    }
    result
}

/// Ensure TrueType winding: outer (largest) contours are CW, inner contours are CCW.
///
/// In TTF Y-up space with non-zero winding fill rule:
/// - Outer contours: clockwise → signed_area < 0
/// - Inner holes:    counter-clockwise → signed_area > 0
///
/// We sort by absolute area (largest = outermost), then alternate winding direction
/// for nested contours. For simplicity (icon fonts rarely have deep nesting), we use
/// a heuristic: the largest contour is outer (CW), subsequent smaller ones that are
/// "inside" the largest are inner (CCW).
fn fix_contour_winding(path: BezPath) -> BezPath {
    let contours = split_contours(&path);
    if contours.len() <= 1 {
        return path;
    }

    // Compute signed areas
    let mut with_area: Vec<(BezPath, f64)> = contours
        .into_iter()
        .map(|c| {
            let a = signed_area(&c);
            (c, a)
        })
        .collect();

    // Sort by absolute area descending (largest first = outermost)
    with_area.sort_by(|a, b| {
        b.1.abs()
            .partial_cmp(&a.1.abs())
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Largest contour: ensure CW (area < 0 in Y-up TTF space)
    // Subsequent contours: alternate — if inside the outer, make CCW (area > 0)
    // Simple heuristic: odd-indexed (0-based) = outer (CW), even-indexed contours
    // that are smaller = inner (CCW). This works for the common icon case.
    //
    // More precisely: the first (largest) should be CW, rest should be CCW if they're holes.
    // We use the sign convention: outer = CW = negative area, inner = CCW = positive area.
    let mut result = BezPath::new();
    for (i, (contour, area)) in with_area.into_iter().enumerate() {
        let should_be_cw = i == 0; // largest = outer = CW
                                   // In Y-up space, CW = negative signed area (using our shoelace formula)
        let currently_cw = area < 0.0;
        let corrected = if should_be_cw == currently_cw {
            contour
        } else {
            reverse_contour(&contour)
        };
        for &el in corrected.elements() {
            result.push(el);
        }
    }
    result
}
