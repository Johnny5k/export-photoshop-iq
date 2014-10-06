/*!
 * iQ Images for Photoshop
 * =============================
 *
 * Version: 0.2
 * Author Christopher Mischler
 * Last Modified: 9/22/2014
 *
 * Based on "Android Assets for Photoshop" by Gaston Figueroa (Uncorked Studios)
 * Site: uncorkedstudios.com
 * Licensed under the MIT license
 */


// Photoshop variables
// Include settings for all the images you want exported.
var outputImageOpts = [
    {
      'suffix' : '-desktop_2x',
      'scale' : 100,
      'jpgQuality' : 40
    },
    {
      'suffix' : '-desktop',
      'scale' : 50,
      'jpgQuality' : 50
    },
    {
      'suffix' : '-tablet_2x',
      'scale' : 82,
      'jpgQuality' : 40
    },
    {
      'suffix' : '-tablet',
      'scale' : 41,
      'jpgQuality' : 50
    },
    {
      'suffix' : '-640',
      'width' : 640,
      'jpgQuality' : 50
    }
  ],
  cropTransparency = false,
  pngQuality = 1,
  docRef = app.activeDocument,
  activeLayer = docRef.activeLayer,
  activeLayer2,
  filenameFull = docRef.name,
  filenameRoot = filenameFull.substr(0, filenameFull.lastIndexOf('.')).replace(/\s+/g,'-'),
  filenameExt = filenameFull.substr(filenameFull.lastIndexOf('.') + 1).toLowerCase().replace('jpeg','jpg'),

  // strips all of these strings from the filename, since we're adding our own suffixes to the end of the filename.
  stripArr = ['-tablet','-desktop','-mobile','_tablet','_desktop','_mobile','tablet','desktop','mobile','-2x','@2x','_2x','2x','-retina','_retina','@retina','retina'],
  filenameStripped = stripStringsFromStr(filenameRoot,stripArr);

// Run main function
init();

// The other functions
function init() {
  if(!isDocumentNew()) {
    for (var i = 0; i < outputImageOpts.length; i++) {
      saveFunc(outputImageOpts[i]);
    }
  } else {
    alert("Please save your document before running this script.");
  }
}

// Test if the document is new (unsaved)
// http://2.adobe-photoshop-scripting.overzone.net/determine-if-file-has-never-been-saved-in-javascript-t264.html

function isDocumentNew(doc){
  // assumes doc is the activeDocument
  cTID = function(s) { return app.charIDToTypeID(s); }
  var ref = new ActionReference();
  ref.putEnumerated( cTID("Dcmn"),
  cTID("Ordn"),
  cTID("Trgt") ); //activeDoc
  var desc = executeActionGet(ref);
  var rc = true;
    if (desc.hasKey(cTID("FilR"))) { //FileReference
    var path = desc.getPath(cTID("FilR"));

    if (path) {
      rc = (path.absoluteURI.length == 0);
    }
  }
  return rc;
};


function resizeDocPct(document, scale) {
  var calcWidth, newWidth;
  // These are if you want to crop out any negative space. For our purposes, I want to keep
  // any negative space in pngs, so we're not using these.
  if (cropTransparency) {
    calcWidth  = activeLayer.bounds[2] - activeLayer.bounds[0], // Get layer's width
    newWidth = calcWidth * scale / 100;
  } else {
    newWidth = docRef.width * scale / 100;
  }

  // Resize temp document using Bicubic interpolation
  resizeLayer(newWidth);

  // Merge all layers inside the temp document
  activeLayer2.merge();
}

function resizeDocWidth(document, newWidth) {

  // Resize temp document using Bicubic interpolation
  resizeLayer(newWidth);

  // Merge all layers inside the temp document
  activeLayer2.merge();
}


// document.resizeImage doesn't seem to support scalestyles so we're using this workaround from http://ps-scripts.com/bb/viewtopic.php?p=14359
function resizeLayer(newWidth) {
  var idImgS = charIDToTypeID( "ImgS" );
  var desc2 = new ActionDescriptor();
  var idWdth = charIDToTypeID( "Wdth" );
  var idPxl = charIDToTypeID( "#Pxl" );
  desc2.putUnitDouble( idWdth, idPxl, newWidth);
  var idscaleStyles = stringIDToTypeID( "scaleStyles" );
  desc2.putBoolean( idscaleStyles, true );
  var idCnsP = charIDToTypeID( "CnsP" );
  desc2.putBoolean( idCnsP, true );
  var idIntr = charIDToTypeID( "Intr" );
  var idIntp = charIDToTypeID( "Intp" );
  var idBcbc = charIDToTypeID( "Bcbc" );
  desc2.putEnumerated( idIntr, idIntp, idBcbc );
  executeAction( idImgS, desc2, DialogModes.NO );
}

function dupToNewFile() {
  var fileName = activeLayer.name.replace(/\.[^\.]+$/, ''),
    calcWidth,
    calcHeight,
    document,
    docResolution = docRef.resolution;

  if (cropTransparency) {
    calcWidth  = Math.ceil(activeLayer.bounds[2] - activeLayer.bounds[0]);
    calcHeight = Math.ceil(activeLayer.bounds[3] - activeLayer.bounds[1]);
  } else {
    calcWidth  = docRef.width;
    calcHeight = docRef.height;
  }
  document = app.documents.add(calcWidth, calcHeight, docResolution, fileName, NewDocumentMode.RGB,
  DocumentFill.TRANSPARENT);

  app.activeDocument = docRef;

  // Duplicated selection to a temp document
  activeLayer.duplicate(document, ElementPlacement.INSIDE);

  // Set focus on temp document
  app.activeDocument = document;

  // Assign a variable to the layer we pasted inside the temp document
  activeLayer2 = document.activeLayer;

  if (cropTransparency) {
    // Center the layer, but only if cropTransparency is true.
    activeLayer2.translate(-activeLayer2.bounds[0],-activeLayer2.bounds[1]);
  }
}

function saveFunc(imgOpts) {
  dupToNewFile();
  var docRef2 = app.activeDocument;

  if (imgOpts.scale) {
    resizeDocPct(docRef2, imgOpts.scale);
  } else if (imgOpts.width) {
    resizeDocWidth(docRef2, imgOpts.width);
  } else {
    alert("ERROR: You have to include 'scale' or 'width' in the outputImageOpts of each image option.");
  }

  var Path = docRef.path,
    folder = Folder(Path + '/_compressed-images');

  if(!folder.exists) {
    folder.create();
  }

  var saveFile = File(folder + "/" + filenameStripped + imgOpts.suffix + "." + filenameExt);

  var sfwOptions = new ExportOptionsSaveForWeb();
    sfwOptions.includeProfile = false;
    sfwOptions.interlaced = false;
    sfwOptions.optimized = true;

    if (filenameExt === 'png') {
      sfwOptions.format = SaveDocumentType.PNG;
      sfwOptions.PNG8 = false;
      sfwOptions.transparency = true;
      sfwOptions.transparencyAmount = 100;
      sfwOptions.transparencyDither = Dither.NONE;
      sfwOptions.webSnap = 0;
    } else if (filenameExt === 'jpg') {
      sfwOptions.format = SaveDocumentType.JPEG;
      sfwOptions.quality = imgOpts.jpgQuality ? imgOpts.jpgQuality : 50;
    } else {
      alert("ERROR: This script only works with JPG and PNG images.");
      return;
    }

  // Export the layer as a PNG
  activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, sfwOptions);

  // Close the document without saving
  activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}



// stripts out any references to tablet, desktop, mobile, or 2x so we just have the root filename,
// and we can add those back where appropriate.
function stripStringsFromStr(input,stripArr) {
  var newStr = input,
      regex;
  for (var i = 0; i < stripArr.length; i++) {
    regex = new RegExp(stripArr[i], "g");
    newStr = newStr.replace(regex, '');
  }
  return newStr;
}
