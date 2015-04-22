Mapmaker.JuntoView = (function($) {

	var juntoView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "juntoView";

		var html = document.getElementById("juntoTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(juntoView.prototype, Mapmaker.Mixins.Visibility);

	juntoView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	juntoView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new juntoView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.JuntoView.events = {
	turnOn: "Mapmaker:JuntoView:turnOn",
	turnOff: "Mapmaker:JuntoView:turnOff"
};
