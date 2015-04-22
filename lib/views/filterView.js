Mapmaker.FilterView = (function($) {

	var filterView = function() {
		this.events = {
			"dblclick"                : "open",
			"click .icon.doc"         : "select",
			"contextmenu .icon.doc"   : "showMenu",
			"click .mapCountIcon"     : "toggle",
			"click .title"            : "hide",
			"mouseover .title .date"  : "showTooltip"
		};

		this.className = "filterView";

		var html = document.getElementById("filterTemplate").innerHTML;
		this.template = Hogan.compile(html);
	};

	_.extend(filterView.prototype, Mapmaker.Mixins.Visibility);

	filterView.prototype.initialize = function(options) {
		_.extend(this, _.pick(options, "mapView"));

		this.mapView.$parent.append(this.render().el);
	};

	filterView.prototype.render = function() {
		this.$el.html();
		return this;
	};

	return Backbone.View.extend(new filterView());
}(jQuery));

/**
 * @class
 * @static
 */
Mapmaker.FilterView.events = {
	change: "Mapmaker:FilterView:change"
};


Mapmaker.Filter = {
    filters: {
        name: "",
        metacodes: [],
        mappers: [],
        synapses: []
    },
    visible: {
        metacodes: [],
        mappers: [],
        synapses: []
    },
    isOpen: false,
    changing: false,
    init: function () {
        var self = Mapmaker.Filter;

        $('.sidebarFilterIcon').click(self.toggleBox);

        $('.sidebarFilterBox .showAllMetacodes').click(self.filterNoMetacodes);
        $('.sidebarFilterBox .showAllSynapses').click(self.filterNoSynapses);
        $('.sidebarFilterBox .showAllMappers').click(self.filterNoMappers);
        $('.sidebarFilterBox .hideAllMetacodes').click(self.filterAllMetacodes);
        $('.sidebarFilterBox .hideAllSynapses').click(self.filterAllSynapses);
        $('.sidebarFilterBox .hideAllMappers').click(self.filterAllMappers);

        self.bindLiClicks();
	    self.getFilterData();
    },
    toggleBox: function (event) {
        var self = Mapmaker.Filter;

        if (self.isOpen) self.close();
        else self.open();

        event.stopPropagation();
    },
    open: function () {
        var self = Mapmaker.Filter;

        Mapmaker.GlobalUI.Account.close();
        Mapmaker.Realtime.close();
        $('.sidebarFilterIcon div').addClass('hide');


        if (!self.isOpen && !self.changing) {
            self.changing = true;

            var height = $(document).height() - 108;
            $('.sidebarFilterBox').css('max-height', height + 'px').fadeIn(200, function () {
                self.changing = false;
                self.isOpen = true;
            });
        }
    },
    close: function () {
        var self = Mapmaker.Filter;
        $('.sidebarFilterIcon div').removeClass('hide');


        if (!self.changing) {
            self.changing = true;

            $('.sidebarFilterBox').fadeOut(200, function () {
                self.changing = false;
                self.isOpen = false;
            });
        }
    },
    reset: function () {
        var self = Mapmaker.Filter;

        self.filters.metacodes = [];
        self.filters.mappers = [];
        self.filters.synapses = [];
        self.visible.metacodes = [];
        self.visible.mappers = [];
        self.visible.synapses = [];

        $('#filter_by_metacode ul').empty(); 
        $('#filter_by_mapper ul').empty();
        $('#filter_by_synapse ul').empty();

        $('.filterBox .showAll').addClass('active');
    },
    /*  
    Most of this data essentially depends on the ruby function which are happening for filter inside view filterBox
    But what these function do is load this data into three accessible array within java : metacodes, mappers and synapses
    */
    getFilterData: function () {
        var self = Mapmaker.Filter;

        var metacode, mapper, synapse;

        $('#filter_by_metacode li').each(function() {
            metacode = $( this ).attr('data-id');
            self.filters.metacodes.push(metacode);
            self.visible.metacodes.push(metacode);
        }); 

        $('#filter_by_mapper li').each(function()  {
            mapper = ($( this ).attr('data-id'));
            self.filters.mappers.push(mapper);
            self.visible.mappers.push(mapper);
        });

        $('#filter_by_synapse li').each(function()  {
            synapse = ($( this ).attr('data-id'));  
            self.filters.synapses.push(synapse);
            self.visible.synapses.push(synapse);
        });
    },
    bindLiClicks: function () {
        var self = Mapmaker.Filter;
        $('#filter_by_metacode ul li').unbind().click(self.toggleMetacode);
        $('#filter_by_mapper ul li').unbind().click(self.toggleMapper);
        $('#filter_by_synapse ul li').unbind().click(self.toggleSynapse);
    },
    // an abstraction function for checkMetacodes, checkMappers, checkSynapses to reduce
    // code redundancy
    /*
    @param 
    */
    updateFilters: function (collection, propertyToCheck, correlatedModel, filtersToUse, listToModify) {
        var self = Mapmaker.Filter;
        
        var newList = [];
        var removed = [];
        var added = [];
        
        // the first option enables us to accept
        // ['Topics', 'Synapses'] as 'collection'
        if (typeof collection === "object") {
            Mapmaker[collection[0]].each(function(model) {
                var prop = model.get(propertyToCheck) ? model.get(propertyToCheck).toString() : false;
                if (prop && newList.indexOf(prop) === -1) {
                    newList.push(prop);
                }
            });
            Mapmaker[collection[1]].each(function(model) {
                var prop = model.get(propertyToCheck) ? model.get(propertyToCheck).toString() : false;
                if (prop && newList.indexOf(prop) === -1) {
                    newList.push(prop);
                }
            });
        }
        else if (typeof collection === "string") {
            Mapmaker[collection].each(function(model) {
                var prop = model.get(propertyToCheck) ? model.get(propertyToCheck).toString() : false;
                if (prop && newList.indexOf(prop) === -1) {
                    newList.push(prop);
                }
            });
        }
        
        removed = _.difference(self.filters[filtersToUse], newList);
        added = _.difference(newList, self.filters[filtersToUse]);
        
        // remove the list items for things no longer present on the map
        _.each(removed, function(identifier) {
            $('#filter_by_' + listToModify + ' li[data-id="' + identifier + '"]').fadeOut('fast',function(){
                $(this).remove();
            });
            index = self.visible[filtersToUse].indexOf(identifier);
            self.visible[filtersToUse].splice(index, 1);
        });
        
        var model, li, jQueryLi;
        function sortAlpha(a,b){
            return a.childNodes[1].innerHTML.toLowerCase() > b.childNodes[1].innerHTML.toLowerCase() ? 1 : -1;  
        }
        // for each new filter to be added, create a list item for it and fade it in
        _.each(added, function (identifier) {
            model = Mapmaker[correlatedModel].get(identifier) || 
                Mapmaker[correlatedModel].find(function (model) {
                    return model.get(propertyToCheck) === identifier;
                });
            li = model.prepareLiForFilter();
            jQueryLi = $(li).hide();
            $('li', '#filter_by_' + listToModify + ' ul').add(jQueryLi.fadeIn("fast"))
                .sort(sortAlpha).appendTo('#filter_by_' + listToModify + ' ul');
            self.visible[filtersToUse].push(identifier);
        });

        // update the list of filters with the new list we just generated
        self.filters[filtersToUse] = newList;

        // make sure clicks on list items still trigger the right events
        self.bindLiClicks();
    },
    checkMetacodes: function () {
        var self = Mapmaker.Filter;
        self.updateFilters('Topics', 'metacode_id', 'Metacodes', 'metacodes', 'metacode');
    },
    checkMappers: function () {
        var self = Mapmaker.Filter;
        var onMap = Mapmaker.Active.Map ? true : false;
        if (onMap) {
            self.updateFilters('Mappings', 'user_id', 'Mappers', 'mappers', 'mapper');
        }
        else {
            // on topic view
            self.updateFilters(['Topics', 'Synapses'], 'user_id', 'Creators', 'mappers', 'mapper');
        }
    },
    checkSynapses: function () {
        var self = Mapmaker.Filter;
        self.updateFilters('Synapses', 'desc', 'Synapses', 'synapses', 'synapse');
    },
    filterAllMetacodes: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_metacode ul li').addClass('toggledOff');
        $('.showAllMetacodes').removeClass('active');
        $('.hideAllMetacodes').addClass('active');
        self.visible.metacodes = [];
        self.passFilters();
    },
    filterNoMetacodes: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_metacode ul li').removeClass('toggledOff');
        $('.showAllMetacodes').addClass('active');
        $('.hideAllMetacodes').removeClass('active');
        self.visible.metacodes = self.filters.metacodes.slice();
        self.passFilters();
    },
    filterAllMappers: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_mapper ul li').addClass('toggledOff');
        $('.showAllMappers').removeClass('active');
        $('.hideAllMappers').addClass('active');
        self.visible.mappers = [];
        self.passFilters();       
    },
    filterNoMappers: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_mapper ul li').removeClass('toggledOff');
        $('.showAllMappers').addClass('active');
        $('.hideAllMappers').removeClass('active');
        self.visible.mappers = self.filters.mappers.slice();
        self.passFilters();
    },
    filterAllSynapses: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_synapse ul li').addClass('toggledOff');
        $('.showAllSynapses').removeClass('active');
        $('.hideAllSynapses').addClass('active');
        self.visible.synapses = [];
        self.passFilters();
    },
    filterNoSynapses: function (e) {
        var self = Mapmaker.Filter;
        $('#filter_by_synapse ul li').removeClass('toggledOff');
        $('.showAllSynapses').addClass('active');
        $('.hideAllSynapses').removeClass('active');
        self.visible.synapses = self.filters.synapses.slice();
        self.passFilters();
    },
    // an abstraction function for toggleMetacode, toggleMapper, toggleSynapse
    // to reduce code redundancy
    // gets called in the context of a list item in a filter box
    toggleLi: function (whichToFilter) {
        var self = Mapmaker.Filter, index;
        var id = $(this).attr("data-id");
        if (self.visible[whichToFilter].indexOf(id) == -1) {
            self.visible[whichToFilter].push(id);
            $(this).removeClass('toggledOff');
        }
        else {
            index = self.visible[whichToFilter].indexOf(id);
            self.visible[whichToFilter].splice(index, 1);
            $(this).addClass('toggledOff');
        }
        self.passFilters();
    },
    toggleMetacode: function () {
        var self = Mapmaker.Filter;
        self.toggleLi.call(this, 'metacodes');

        if (self.visible.metacodes.length === self.filters.metacodes.length) {
            $('.showAllMetacodes').addClass('active');
            $('.hideAllMetacodes').removeClass('active');
        }
        else if (self.visible.metacodes.length === 0) {
            $('.showAllMetacodes').removeClass('active');
            $('.hideAllMetacodes').addClass('active');
        }
        else {
            $('.showAllMetacodes').removeClass('active');
            $('.hideAllMetacodes').removeClass('active');
        }
    },
    toggleMapper: function () {
        var self = Mapmaker.Filter;
        self.toggleLi.call(this, 'mappers');

        if (self.visible.mappers.length === self.filters.mappers.length) {
            $('.showAllMappers').addClass('active');
            $('.hideAllMappers').removeClass('active');
        }
        else if (self.visible.mappers.length === 0) {
            $('.showAllMappers').removeClass('active');
            $('.hideAllMappers').addClass('active');
        }
        else {
            $('.showAllMappers').removeClass('active');
            $('.hideAllMappers').removeClass('active');
        }
    },
    toggleSynapse: function () {
        var self = Mapmaker.Filter;
        self.toggleLi.call(this, 'synapses');

        if (self.visible.synapses.length === self.filters.synapses.length) {
            $('.showAllSynapses').addClass('active');
            $('.hideAllSynapses').removeClass('active');
        }
        else if (self.visible.synapses.length === 0) {
            $('.showAllSynapses').removeClass('active');
            $('.hideAllSynapses').addClass('active');
        }
        else {
            $('.showAllSynapses').removeClass('active');
            $('.hideAllSynapses').removeClass('active');
        }
    },
    passFilters: function () {        
        var self = Mapmaker.Filter;
        var visible = self.visible;

        var passesMetacode, passesMapper, passesSynapse;
        var onMap;

        if (Mapmaker.Active.Map) {
            onMap = true;
        }
        else if (Mapmaker.Active.Topic) {
            onMap = false;
        }

        var opacityForFilter = onMap ? 0 : 0.4;

        Mapmaker.Topics.each(function(topic) {
            var n = topic.get('node');
            var metacode_id = topic.get("metacode_id").toString();

            if (visible.metacodes.indexOf(metacode_id) == -1) passesMetacode = false;
            else passesMetacode = true;

            if (onMap) {
                // when on a map, 
                // we filter by mapper according to the person who added the 
                // topic or synapse to the map
                var user_id = topic.getMapping().get("user_id").toString();
                if (visible.mappers.indexOf(user_id) == -1) passesMapper = false;
                else passesMapper = true;
            }
            else {
                // when on a topic view, 
                // we filter by mapper according to the person who created the 
                // topic or synapse
                var user_id = topic.get("user_id").toString();
                if (visible.mappers.indexOf(user_id) == -1) passesMapper = false;
                else passesMapper = true;
            }

            if (passesMetacode && passesMapper) {
                if (n) {
                    n.setData('alpha', 1, 'end');
                }
                else console.log(topic);
            }
            else {
                if (n) {
                    Mapmaker.Control.deselectNode(n, true);
                    n.setData('alpha', opacityForFilter, 'end');
                    n.eachAdjacency(function(e){
                        Mapmaker.Control.deselectEdge(e, true);
                    });
                }
                else console.log(topic);
            }
        });

        // flag all the edges back to 'untouched'
        Mapmaker.Synapses.each(function(synapse) {
           var e = synapse.get('edge');
           e.setData('touched', false);
        });
        Mapmaker.Synapses.each(function(synapse) {
           var e = synapse.get('edge');
           var desc;
           var user_id = synapse.get("user_id").toString();

           if (e && !e.getData('touched')) {

                var synapses = e.getData('synapses');

                // if any of the synapses represent by the edge are still unfiltered
                // leave the edge visible
                passesSynapse = false;
                for (var i = 0; i < synapses.length; i++) {
                    desc = synapses[i].get("desc");
                    if (visible.synapses.indexOf(desc) > -1) passesSynapse = true;
                }

                // if the synapse description being displayed is now being
                // filtered, set the displayIndex to the first unfiltered synapse if there is one
                var displayIndex = e.getData("displayIndex") ? e.getData("displayIndex") : 0;
                var displayedSynapse = synapses[displayIndex];
                desc = displayedSynapse.get("desc");
                if (passesSynapse && visible.synapses.indexOf(desc) == -1) {
                    // iterate and find an unfiltered one
                    for (var i = 0; i < synapses.length; i++) {
                        desc = synapses[i].get("desc");
                        if (visible.synapses.indexOf(desc) > -1) {
                            e.setData('displayIndex', i);
                            break;
                        }
                    }
                }

                if (onMap) {
                    // when on a map, 
                    // we filter by mapper according to the person who added the 
                    // topic or synapse to the map
                    user_id = synapse.getMapping().get("user_id").toString();
                }
                if (visible.mappers.indexOf(user_id) == -1) passesMapper = false;
                else passesMapper = true;

                var color = Mapmaker.Settings.colors.synapses.normal;
                if (passesSynapse && passesMapper) {
                    e.setData('alpha', 1, 'end');
                    e.setData('color', color, 'end');
                }
                else {
                    Mapmaker.Control.deselectEdge(e, true);
                    e.setData('alpha', opacityForFilter, 'end');
                }

                e.setData('touched', true);
            }
            else if (!e) console.log(synapse);
        });
            
        // run the animation
        Mapmaker.Visualize.mGraph.fx.animate({  
          modes: ['node-property:alpha',  
                'edge-property:alpha'],  
          duration: 200  
        });
    }
};
