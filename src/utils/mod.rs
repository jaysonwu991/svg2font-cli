/// Simplified font conversion utilities
/// In production, these would use proper font generation libraries
use crate::{Error, Result};

/// Convert TTF to WOFF format (zlib compression) with optimized allocations
pub fn ttf_to_woff(ttf: &[u8]) -> Result<Vec<u8>> {
    use flate2::write::ZlibEncoder;
    use flate2::Compression;
    use std::io::Write;

    if ttf.len() < 12 {
        return Err(Error::FontGeneration("Invalid TTF data".to_string()));
    }

    // Pre-allocate with estimated size (header + compressed data)
    let estimated_size = 44 + ttf.len();
    let mut woff = Vec::with_capacity(estimated_size);

    // WOFF header
    woff.extend_from_slice(b"wOFF");
    woff.extend_from_slice(&ttf[0..4]); // flavor
    woff.extend_from_slice(&[0u8; 4]); // length placeholder
    woff.extend_from_slice(&[0u8; 2]); // numTables
    woff.extend_from_slice(&[0u8; 2]); // reserved
    woff.extend_from_slice(&(ttf.len() as u32).to_be_bytes());
    woff.extend_from_slice(&[1u8, 0, 0, 0]); // version
    woff.extend_from_slice(&[0u8; 20]); // metadata

    // Compress
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(ttf)
        .map_err(|e| Error::FontGeneration(e.to_string()))?;
    let compressed = encoder
        .finish()
        .map_err(|e| Error::FontGeneration(e.to_string()))?;

    woff.extend_from_slice(&compressed);

    // Update length
    let total_length = woff.len() as u32;
    woff[8..12].copy_from_slice(&total_length.to_be_bytes());

    Ok(woff)
}

/// Convert TTF to WOFF2 format (brotli compression) with optimized allocations
pub fn ttf_to_woff2(ttf: &[u8]) -> Result<Vec<u8>> {
    use brotli::enc::BrotliEncoderParams;

    if ttf.len() < 4 {
        return Err(Error::FontGeneration("Invalid TTF data".to_string()));
    }

    // Pre-allocate with estimated size
    let estimated_size = 12 + (ttf.len() * 3 / 4);
    let mut woff2 = Vec::with_capacity(estimated_size);

    // WOFF2 header
    woff2.extend_from_slice(b"wOF2");
    woff2.extend_from_slice(&ttf[0..4]); // flavor
    woff2.extend_from_slice(&[0u8; 4]); // length placeholder

    // Compress with Brotli
    let mut compressed = Vec::new();
    let params = BrotliEncoderParams::default();
    let mut cursor = std::io::Cursor::new(ttf);
    brotli::BrotliCompress(&mut cursor, &mut compressed, &params)
        .map_err(|e| Error::FontGeneration(e.to_string()))?;

    woff2.extend_from_slice(&compressed);

    // Update length
    let total_length = woff2.len() as u32;
    woff2[8..12].copy_from_slice(&total_length.to_be_bytes());

    Ok(woff2)
}

/// Convert TTF to EOT format with optimized allocations
pub fn ttf_to_eot(ttf: &[u8]) -> Result<Vec<u8>> {
    use flate2::write::ZlibEncoder;
    use flate2::Compression;
    use std::io::Write;

    // Pre-allocate with estimated size (header + compressed)
    let estimated_size = 16 + ttf.len();
    let mut eot = Vec::with_capacity(estimated_size);

    // EOT header
    eot.extend_from_slice(&[0u8; 4]); // file size placeholder
    eot.extend_from_slice(&(ttf.len() as u32).to_le_bytes());
    eot.extend_from_slice(&0x00020001u32.to_le_bytes());
    eot.extend_from_slice(&[0u8; 4]); // flags

    // Compress
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(ttf)
        .map_err(|e| Error::FontGeneration(e.to_string()))?;
    let compressed = encoder
        .finish()
        .map_err(|e| Error::FontGeneration(e.to_string()))?;

    eot.extend_from_slice(&compressed);

    // Update file size
    let total_size = eot.len() as u32;
    eot[0..4].copy_from_slice(&total_size.to_le_bytes());

    Ok(eot)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Minimal valid TTF: 12-byte sfnt header (required by ttf_to_woff)
    // sfVersion=0x00010000 (TrueType), numTables=0, searchRange=0, entrySelector=0, rangeShift=0
    fn minimal_ttf() -> Vec<u8> {
        let mut data = vec![0u8; 12];
        data[0..4].copy_from_slice(&[0x00, 0x01, 0x00, 0x00]); // sfVersion
        data
    }

    #[test]
    fn test_ttf_to_woff_returns_woff_signature() {
        let ttf = minimal_ttf();
        let woff = ttf_to_woff(&ttf).unwrap();
        assert_eq!(&woff[0..4], b"wOFF");
    }

    #[test]
    fn test_ttf_to_woff_length_field_correct() {
        let ttf = minimal_ttf();
        let woff = ttf_to_woff(&ttf).unwrap();
        let stored_len = u32::from_be_bytes(woff[8..12].try_into().unwrap());
        assert_eq!(stored_len as usize, woff.len());
    }

    #[test]
    fn test_ttf_to_woff_too_short() {
        let result = ttf_to_woff(&[0u8; 4]);
        assert!(result.is_err());
    }

    #[test]
    fn test_ttf_to_woff2_returns_woff2_signature() {
        let ttf = minimal_ttf();
        let woff2 = ttf_to_woff2(&ttf).unwrap();
        assert_eq!(&woff2[0..4], b"wOF2");
    }

    #[test]
    fn test_ttf_to_woff2_length_field_correct() {
        let ttf = minimal_ttf();
        let woff2 = ttf_to_woff2(&ttf).unwrap();
        let stored_len = u32::from_be_bytes(woff2[8..12].try_into().unwrap());
        assert_eq!(stored_len as usize, woff2.len());
    }

    #[test]
    fn test_ttf_to_woff2_too_short() {
        let result = ttf_to_woff2(&[0u8; 2]);
        assert!(result.is_err());
    }

    #[test]
    fn test_ttf_to_eot_returns_non_empty() {
        let ttf = minimal_ttf();
        let eot = ttf_to_eot(&ttf).unwrap();
        assert!(!eot.is_empty());
    }

    #[test]
    fn test_ttf_to_eot_file_size_field_correct() {
        let ttf = minimal_ttf();
        let eot = ttf_to_eot(&ttf).unwrap();
        let stored_size = u32::from_le_bytes(eot[0..4].try_into().unwrap());
        assert_eq!(stored_size as usize, eot.len());
    }

    #[test]
    fn test_ttf_to_eot_original_size_field() {
        let ttf = minimal_ttf();
        let eot = ttf_to_eot(&ttf).unwrap();
        let orig_size = u32::from_le_bytes(eot[4..8].try_into().unwrap());
        assert_eq!(orig_size as usize, ttf.len());
    }

    #[test]
    fn test_woff_preserves_flavor() {
        let ttf = minimal_ttf();
        let woff = ttf_to_woff(&ttf).unwrap();
        // WOFF flavor field (bytes 4–7) should match TTF sfVersion bytes 0–3
        assert_eq!(&woff[4..8], &ttf[0..4]);
    }
}
