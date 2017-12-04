var L = require("leaflet");

var Label = L.Layer.extend({
    options: {
        cssClass: "area-label",
        events: "click"
    },

    initialize: function (bounds, text, options) {
        this._bounds = bounds;
        this._text = text;
        this._element = null;

        L.Util.setOptions(this, options);

        if (typeof this.options.events === "string") {
            this.options.events = this.options.events.split(/\s+/);
        }
    },

    onAdd: function (map) {
        var i, handler;

        this._map = map;

        this._element = L.DomUtil.create("div", this.options.cssClass + " leaflet-zoom-hide");
        this._element.appendChild(document.createTextNode(this._text));
        map.getPanes().overlayPane.appendChild(this._element);

        map.on("viewreset zoomend", this._reset, this);
        this._reset();

        handler = function() { this.label.fire(this.type); };
        for (i = 0; i < this.options.events.length; i += 1) {
            var type = this.options.events[i],
                context = { label: this, type: type };
            L.DomEvent.addListener(this._element, type, handler, context);
        }
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._element);
        map.off("viewreset", this._reset, this);
        map.off("zoomend", this._reset, this);
        this._element = null;
    },

    _reset: function () {
        var center = this._map.latLngToLayerPoint(this._bounds.getCenter()),
            nw = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
            se = this._map.latLngToLayerPoint(this._bounds.getSouthEast()),
            height, position;

        this._element.style.width = (se.x - nw.x) + "px";
        height = this._element.clientHeight;
        position = new L.Point(nw.x, center.y - height / 2);
        L.DomUtil.setPosition(this._element, position);
    },

    setBounds: function(bounds) {
        this._bounds = bounds;
        this._reset();
        return this;
    }
});

module.exports = function (bounds, text, options) {
    return new Label(bounds, text, options);
};
