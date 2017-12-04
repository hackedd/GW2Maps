var $ = require("jquery"),
    L = require("leaflet"),
    pointTypes = {
        "landmark": "Point of Interest",
        "hero": "Hero Point",
        "task": "Task",
        "vista": "Vista",
        "waypoint": "Waypoint",
        "unlock": "Dungeon"
    },
    PoiMarker,
    icons;

PoiMarker = L.Marker.extend({
    initialize: function (poi, latlng, options) {
        this.poi = poi;

        options = options || {};
        var icon = this._parseIcon(options.icon, poi.type, poi.marker);
        if (icon) {
            options.icon = icon;
        }

        var defaultOptions = {
            title: this.getName(),
            raiseOnHover: true
        };
        options = L.extend(defaultOptions, options);
        L.Marker.prototype.initialize.call(this, latlng, options);
    },

    _parseIcon: function (icon, type, marker) {
        if (icon === "default" || icon === "complete") {
            return icons[type];
        }

        if (icon === "empty" || icon === "incomplete") {
            return icons[type + "-empty"];
        }

        if (marker) {
            if (!icons[marker.file_id]) {
                icons[marker.file_id] = L.icon({
                    iconUrl: "https://render.guildwars2.com/file/" + marker.signature + "/" + marker.file_id + ".png",
                    iconSize: [32, 32]
                });
            }
            return icons[marker.file_id];
        }

        return icon || icons[type];
    },

    getPoi: function () {
        return this.poi;
    },

    getName: function () {
        return this.poi.name || pointTypes[this.poi.type];
    },

    setIcon: function (icon) {
        L.Marker.prototype.setIcon.call(this, this._parseIcon(icon, this.poi.type, this.poi.marker));
    }
});

function poiMarker(poi, latlng, options) {
    return new PoiMarker(poi, latlng, options);
}

function createIcons() {
    function createIcon(name) {
        icons[name] = L.divIcon({
            iconSize: [20, 20],
            className: "poi-icon poi-icon-" + name
        });
    }

    icons = {};
    $.each(pointTypes, function (key) {
        createIcon(key);
        createIcon(key + "-empty");
    });
}

function addLayer(map, type) {
    var layer = L.featureGroup();

    map.on("floorchange", function (event) {
        layer.clearLayers();

        $.each(event.data.regions, function (regionId) {
            var region = this;
            $.each(this.maps, function (mapId) {
                var mapData = this;

                function addPoi(poi) {
                    /* Add the map and region information to the POI, so it can be retrieved later. */
                    poi.mapId = mapId;
                    poi.map = mapData;
                    poi.regionId = regionId;
                    poi.region = region;
                    poiMarker(poi, map.unproject(poi.coord)).addTo(layer);
                }

                if (type !== "skill" && type !== "task") {
                    $.each(this.points_of_interest, function () {
                        if (!type || this.type === type) {
                            addPoi(this);
                        }
                    });
                }

                if (!type || type === "skill" || type === "hero") {
                    $.each(this.skill_challenges, function () {
                        this.type = "hero";
                        addPoi(this);
                    });
                }

                if (!type || type === "task") {
                    $.each(this.tasks, function () {
                        this.type = "task";
                        addPoi(this);
                    });
                }
            });
        });
    });

    map.map.on("zoomend", function () {
        if (map.map.getZoom() >= 4) {
            map.map.addLayer(layer);
        } else {
            map.map.removeLayer(layer);
        }
    });

    if (map.map.getZoom() >= 4) {
        layer.addTo(map.map);
    }

    return layer;
}

createIcons();

module.exports = {
    poiMarker: poiMarker,
    addLayer: addLayer
};
