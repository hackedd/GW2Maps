var $ = require("jquery"),
    L = require("leaflet"),
    GW2Map;

function getCoordinates(args) {
    if (args.length === 1) {
        return args[0];
    }
    if (args.length === 2) {
        return [args[0], args[1]];
    }
    throw new Error("Invalid number of arguments");
}

GW2Map = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        zoomClassNamePrefix: "zoom-"
    },

    initialize: function (domId, continent, floor, options) {
        var self = this;

        L.setOptions(self, options);

        self.loadFired = false;

        self.domObj = $("#" + domId);
        if (!self.domObj.length) {
            throw new Error("There is no element with id '" + domId + "'");
        }

        $.get("https://api.guildwars2.com/v1/continents.json", function (data) {
            if (data.continents[continent] !== undefined) {
                self.continent = data.continens[continent];
                self.continent.id = continent;
            } else {
                $.each(data.continents, function (id) {
                    if (this.name === continent) {
                        self.continent = this;
                        self.continent.id = id;
                        return false;
                    }
                });
            }

            if (self.continent === undefined) {
                throw new Error("Unknown continent name or id '" + continent + "'");
            }

            /* Create Leaflet map object. */
            self.map = L.map(domId, {
                minZoom: self.continent.min_zoom,
                maxZoom: self.continent.max_zoom,
                crs: L.CRS.Simple,
                attributionControl: false
            });

            self.fire("create");

            /* Retrieve floor data and create the tile layer. */
            self.setFloor(floor);

            /* Set up event handlers to add a class with the current
             * zoom level to the DOM element. */
            self.map.on("zoomstart", function () { this.domObj.removeClass(this.options.zoomClassNamePrefix + this.map.getZoom()); }, self)
                    .on("zoomend",   function () { this.domObj.addClass(this.options.zoomClassNamePrefix + this.map.getZoom()); }, self)
                    .fire("zoomend");
        });
    },

    project: function () {
        return this.map.project(getCoordinates(arguments), this.map.getMaxZoom());
    },

    unproject: function () {
        return this.map.unproject(getCoordinates(arguments), this.map.getMaxZoom());
    },

    setFloor: function (floor) {
        var self = this, nw, se, bounds,
            params = { continent_id: self.continent.id, floor: floor };

        $.get("https://api.guildwars2.com/v1/map_floor.json", params, function (data) {
            self.floor = floor;
            self.floorData = data;

            /* Get map bounds from the floor data. */
            if (data.clamped_view) {
                nw = self.unproject(data.clamped_view[0]);
                se = self.unproject(data.clamped_view[1]);
            } else {
                nw = self.unproject(0, 0);
                se = self.unproject(data.texture_dims);
            }

            bounds = new L.LatLngBounds([nw, se]);

            if (self.tileLayer) {
                self.tileLayer.addTo(null);
            }

            /* Create a tile layer for the continent and floor. */
            self.tileLayer = L.tileLayer("https://tiles.guildwars2.com/{continent}/{floor}/{z}/{x}/{y}.jpg", {
                minZoom: self.continent.min_zoom,
                maxZoom: self.continent.max_zoom,
                bounds: bounds,
                continuousWorld: true,
                continent: self.continent.id,
                floor: self.floor
            });
            self.tileLayer.addTo(self.map);

            self.map.setMaxBounds(bounds);
            self.map.setView(bounds.getCenter(), 2);

            if (!self.loadFired) {
                self.loadFired = true;
                self.fire("load");
            }

            self.fire("floorchange", {continent: self.continent, floor: floor, data: data});
        });
    }
});

module.exports ={
    init: function (domId, continent, floor) {
        return new GW2Map(domId, continent || "Tyria", floor || 1);
    }
};
