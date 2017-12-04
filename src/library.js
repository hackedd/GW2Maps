var map = require("./map"),
    poi = require("./poi"),
    label = require("./label");

module.exports = {
    map: map,
    poiMarker: poi.poiMarker,
    addLayer: poi.addLayer,
    label: label
};
