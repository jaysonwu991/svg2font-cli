function addSvg(id, file, options) {
  var child = loadXml(file);
  var addOptions = Object.assign({}, svgstoreOptions, options);

  // <defs>
  var childDefs = child(SELECTOR_DEFS);

  removeAttributes(childDefs, addOptions.cleanDefs);

  /* rename defs ids */
  if (addOptions.renameDefs) {
    childDefs.children().each(function (i, _elem) {
      var elem = child(_elem);
      var oldDefId = elem.attr('id');
      var newDefId = id + '_' + oldDefId;
      elem.attr('id', newDefId);

      /* process use tags */
      child('use').each(function (i, use) {
        var hrefLink = '#' + oldDefId;
        var checkableProperties = ['xlink:href', 'href'];
        var foundProperty;
        for (var j = 0; j < checkableProperties.length; j++) {
          var currentProperty = checkableProperties[j];
          if (child(use).prop(currentProperty) === hrefLink) {
            foundProperty = currentProperty;
            break;
          }
        }
        if (!foundProperty) {
          return;
        }
        child(use).attr(foundProperty, '#' + newDefId);
      });

      /* process fill attributes */
      child('[fill="url(#' + oldDefId + ')"]').each(function (i, use) {
        child(use).attr('fill', 'url(#' + newDefId + ')');
      });
    });
  }

  parentDefs.append(childDefs.contents());
  childDefs.remove();

  // <symbol>
  var childSvg = child(SELECTOR_SVG);
  var childSymbol = svgToSymbol(id, child, addOptions);

  removeAttributes(childSymbol, addOptions.cleanSymbols);
  copyAttributes(childSymbol, childSvg, addOptions.copyAttrs);
  setAttributes(childSymbol, addOptions.symbolAttrs);
  parentSvg.append(childSymbol);

  return this;
}
