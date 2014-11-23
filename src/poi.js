define(["leaflet", "jquery"], function (L, $) {
    var pointTypes = {
            "landmark": "Point of Interest",
            "skill": "Skill Point",
            "task": "Task",
            "vista": "Vista",
            "waypoint": "Waypoint",
            "unlock": "Dungeon"
        },
        PoiMarker,
        icons;

    PoiMarker = L.Marker.extend({
        initialize: function (poi, latlng, options) {
            var defaultOptions;

            this.poi = poi;

            defaultOptions = {
                title: this.getName(),
                icon: icons[poi.type] || L.Marker.options.icon,
                raiseOnHover: true
            };

            L.Marker.prototype.initialize.call(this, latlng,
                    L.extend(defaultOptions, options || {}));
        },

        getPoi: function () {
            return this.poi;
        },

        getName: function () {
            return this.poi.name || pointTypes[this.poi.type];
        },

        setIcon: function (icon) {
            if (icon === "default" || icon === "complete") {
                icon = icons[this.poi.type];
            } else if (icon === "empty" || icon === "incomplete") {
                icon = icons[this.poi.type + "-empty"];
            }

            L.Marker.prototype.setIcon.call(this, icon);
        }
    });

    function poiMarker(poi, options) {
        return new PoiMarker(poi, options);
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

                    if (!type || type === "skill") {
                        $.each(this.skill_challenges, function () {
                            this.type = "skill";
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

    return {
        poiMarker: poiMarker,
        addLayer: addLayer
    };
});
