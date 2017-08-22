/**
 * Class ReportFiltersManager
 * BCFTSGASDG-1606 - Shawn - Experimental
 *
 * This class helps in managing the filters pane used in reports.
 * This class is to be specifically for managing the filters within
 * the pane itself. Other filters, such as list-type drop downs and
 * year toggles, are not to be managed with this class. A pattern
 * one may wish to follow is to use this class to create a "base"
 * filter object, and the $.extend() as needed
 *
 * REQUIRED PARAMETERS:
 * @param{ filterID } - String
 * An ID which identifies the element that contains the filters panel
 *
 * @param{ makeFilter } - Function
 * This function, when called, must return a filter object.
 * It will be executed within the context of the ReportFiltersManager
 * instance the constructor is creating. It is given $('#'+filterID)
 * as an argument.
 *
 * OPTIONAL PARAMETERS:
 * @param{ revertFunc } - Function
 * This function, when called, must take whatever actions necessary
 * such that the next time anyone calls upon this instance to create
 * a filter object, it shall return the "default".
 * Return values of this function are ignored.
 * It is invoked in the context of the instance it is used to create
 * and given $('#'+filterID) as an argument.
 *
 * @param{ alertFunc } - Function
 * A function that can be called by others when they wish to notify
 * the instance that a component within the filter has changed. The
 * function is called within the context of $('#'+filterID) and is
 * given two arguments: the [data-id] of the elment that changed and
 * the instance itself
 */
function ReportFiltersManager(filterID, makeFilter, revertFunc, alertFunc){
	this.filter_id = filterID;
	this.$filter_element = $('#'+filterID)
	this.make_filter = makeFilter;
	this.revert_func = revertFunc;
	this.alert_func = alertFunc;
}

/**
 * ReportFiltersManager - getFilters()
 *
 * This method will return an object that represents the most up to date
 * state of the filters. Specific behaviour varies depending on instance.
 * (See constructor)
 * @return A filter object
 */
ReportFiltersManager.prototype.getFilters = function() {
	return this.make_filter(this.$filter_element);
}
/**
 * ReportFiltersManager - resetFilters()
 *
 * This method, when called, will revert filters to a default state
 * by calling the revertFunc provided during the instance's construction.
 * No filter objects are returned.
 */
ReportFiltersManager.prototype.resetFilters = function() {
	if( this.revert_func instanceof Function ) {
		this.revert_func(this.$filter_element);
	}
	//return this.default_filter instanceof Function ? this.default_filter(this.$filter_element) : this.default_filter;
}
/**
 * ReportFiltersManager - alert()
 *
 * Call when one wishes to alert the instance of a change in a filter
 * component.
 * @param dataID The value of the data-id attribute of the component
 */
ReportFiltersManager.prototype.alert = function(dataID) {
	if( this.alert_func instanceof Function ){
		this.alert_func(this.$filter_element, dataID);
	}
}


var init_reports = ( function() {
	var report_filters = {};
	//var mgmt_report_filters = {}; // BCFTSGASDG-1606 - OBSOLETE
	var prjtrack_report_filters = {};


	// BCFTSGASDG-1606 - Experimental
	global.reportFilterManagers = {};

	function initializeReportFilterManagers() {
		// Filter Manager for BST Mgmt Report
		var makeFilter = function($filtersPane) {
			var to_ret = {};
			var new_stack = {};
			$.each(this.activeStack, function(key, val){
				switch(key) {
				case "closedDate":
				case "oppVal":
					if( $('[data-id="'+key+'-checkbox"]', $filtersPane).is(':checked') ){
						var comp = $('[data-id="'+key+'-comparison"]', $filtersPane).val();
						if( comp == 'BN' ) {
							to_ret[key] = $('[data-id="'+key+'-1"]', $filtersPane).val() + comp + $('[data-id="'+key+'-2"]', $filtersPane).val();
						} else {
							to_ret[key] = $('[data-id="'+key+'-1"]', $filtersPane).val() + comp;
						}
						new_stack[key] = true;
					}
					break;
				default: // list_filter and personnel-selection-overlay
					var $field = $('[data-id="'+key+'-add"]', $filtersPane);
					var values = [];
					$.each($field.list_filter('get_values'), function(index, val){
						if( val instanceof Array ) {
							values.push(val[0]); // For some reason, reports prefer to filter by config_label rather than config value
						} else {
							values.push(val);
						}
					});
					if( values.length > 0 ) {
						to_ret[key] = values;
						new_stack[key] = true;
					}
					break;
				}
			});
			this.activeStack = new_stack;
			return to_ret;
		}
		var revertFunc = function($filtersPane) {
			var year = new Date().getFullYear() - 1;
			var new_stack = {closedDate: true};

			// This will reset all multiselects
			$('[data-role="list_filter"], [data-role="personnel-selection-overlay"]', $filtersPane).each(function(){
				$(this).list_filter('reset');
			});

			// Next the estimated closed date
			$('[data-id="closedDate-checkbox"]', $filtersPane).prop('checked', true);
			$('[data-id="closedDate-comparison"]', $filtersPane).val('AF').change();// To trigger the change event, this ensures that the visuals stay up to date
			$('[data-id="closedDate-1"]', $filtersPane).val(year+'-12-31');
			$('[data-id="closedDate-2"]', $filtersPane).val("");

			// Next the opportunity value
			$('[data-id="oppVal-checkbox"]',$filtersPane).attr('checked', false);
			$('[data-id="oppVal-comparison"]',$filtersPane).val('EQ').change();
			$('[data-id="oppVal-1"]', $filtersPane).val("")
			$('[data-id="oppVal-2"]', $filtersPane).val("")

			// Special feature of these two report filters
			// To prevent unnecessary checks
			this.activeStack = new_stack;
		}

		// To prevent unnecessary checks
		var alertFunc = function($filtersPane, dataID) {
			this.activeStack[dataID] = true;
		};

		$.each(['bst-mgmt-report-filters','mgmt-report-filters'], function(index, val){
			global.reportFilterManagers[val] = new ReportFiltersManager(val, makeFilter, revertFunc, alertFunc);
			global.reportFilterManagers[val].resetFilters(); // Ensures that filters are set to their defaults
		});
	}


	// BCFTSGASDG-1530 resetReportFilters Function is moved down and return
	/* BCFTSGASDG-1606 - OBSOLETE
	function resetMgmtReportFilters() {
		var year = new Date().getFullYear() - 1;
		mgmt_report_filters = {
			region : [],
			territory : [],
			productcategory : [],
			sector : [],
			probability : [],
			opp_value : '',
			// opp_date:'',
			// BCFTSGASDG-1494
			opp_date : year + '-12-31AF',
			opp_owner : [],
			country : [],
			salesarea : [],
			view_as : viewAsOverlay.getListFilters()
		}
		$('[data-role="mgmt-report-selection-overlay"]').html('(all)');
		$('[data-role="mgmt-report-selection-overlay-config"]').html('(all)');
		$('#mgmt-report-filters [data-role="personnel-selection-overlay"]')
				.html('(all)'); // Reset ALL personnel selection filters

		$('#filters-mgmt-checkbox1').attr('checked', false);
		$('#filters-mgmt-oppvalue-1').val("");
		$('#filters-mgmt-oppvalue-2').val("");
		$('#filters-mgmt-oppdate-1').val("");
		$('#filters-mgmt-oppdate-2').val("");

		// BCFTSGASDG-1494 - Set opp date to 31/12/16 by default
		$('#filters-mgmt-checkbox2').prop('checked', true);
		$('#filters-mgmt-oppdate-1').val(year + '-12-31');
		changeMgmtReportFilterValue('filters-mgmt-oppdate', 'AF');
		$('#filters-mgmt-comparison2').val('AF');
		$('#mgmt-report-filters .select #filters-mgmt-comparison2').next()
				.text("AFTER");
	}
	*/

	function resetViewAsFilter(datarole) {

		/* BCFTSGASDG-1606 - OBSOLETE
		if (datarole == 'mgmt-report-selection-overlay') {
			mgmt_report_filters.view_as = viewAsOverlay.getListFilters();
			*/
		if (datarole == 'prjtrack-report-selection-overlay') {
			prjtrack_report_filters.view_as = viewAsOverlay.getListFilters();
		} else {
			report_filters.view_as = viewAsOverlay.getListFilters();
		}
	}

	function getSelectionOverlayData(value_type, selected_filters, callback) {
		$.ajax( {
			url : global.database.Main + '/getReportOptions?OpenAgent',
			data : {
				valuetype : value_type,
				filters : JSON.stringify(selected_filters)
			},
			success : function(response) {
				callback(response);
			},
			error : function() {
				alert('error');
			}
		});
	}

	/**
	 * Initializes all elements a child of $('#'+filterID) intended to be
	 * multiselection list filters.
	 * An element is intended to be a multiselection list filter if it matches
	 * any one of the following queries:
	 * 	[data-role="list_filter"]
	 * 	[data-role="personnel-selection-overlay"]
	 * Additionally also initializes the range-filters' second-val show/hide.
	 * @param {body} The <body> element
	 * @param {filterID} The id of the filter pane
	 * @param {datasource} URL which data for the options should come from
	 */
	function initializeReportListFilters(body, filterID, datasource) {

        function createOverlayFromData($field) {
            var valuetype = $field.closest('.filterLayer[data-id]').attr('data-id');
            var overlayTitle = $field.attr('data-title');
            return function() {
                var options_filter = $field.data('options_filter');
                options_filter = $.extend(options_filter instanceof Function ? options_filter() : options_filter, {
                    view_as: viewAsOverlay.viewAs
                });
                $.ajax({
                    url: datasource,
                    type: 'GET',
                    data: {
                        valuetype: valuetype,
                        filters: JSON.stringify(options_filter)
                    },
                    success: function(response) {
                        var options = [];
                        var labels = [];
                        $.each(response.data, function(index, item) {
                        	// getReportOptions return an array of strings
                        	// getBSTReportOptions return an array of plain objects
                        	if( item instanceof Object ) {
                                options.push(item.optionID);
                                labels.push(item.optionLabel);
                        	} else {
                        		labels.push(item);
                        	}
                        });
                        var selected = $($field).list_filter('get_values').map(function(item, index) {
                        	if( item instanceof Array ) {
                                return item[0];
                        	} else if( item instanceof Object ) {
                        		return item.label;
                        	} else {
                        		return item;
                        	}
                        });
                        createOverlayOptionSelection(overlayTitle, labels, selected, function(selected) {
                            $field.list_filter('set_values', selected);
                            $field.list_filter('refresh_display');
                            $field.change(); // Use jQuery to fire the change event
                        }, false, (options.length > 0? options : null));
                    },
                    error: function() {
                        alert("Error");
                    }
                });
            }
        }

        // BCFTSGASDG-1606 - Shawn - Added
        // Some filters, such as territories, will show different options
        // depending on specific runtime situations.
        // This function will attach to $listFilter either an object or a
        // function which return an object. This will then be passed as
        // the value for "filter" when a request to getBSTReportOptions is made
        function attachOptionsFilter($listFilter) {
        	var attach = {};
        	switch( filterID ) {
        	case "mgmt-report-filters":
        		attach = function() {
        			return global.reportFilterManagers[filterID].getFilters();
        		}
        		break;
        	case "bst-mgmt-report-filters":
        		if( $listFilter.attr('data-id') == 'territories-add' ) {
        			attach = function() {
                        var roles = viewAsOverlay.viewAs.myself ? global.user.access.roles : viewAsOverlay.viewAs.userRoles;
                        return {
                        	show_all: roles.reduce(function(sofar, next) {
                        		return sofar || (next == 'HEAD OFFICE');
                        		}, false)
                        }
        			}
        		}
        		break;
        	case "bst-sales-report-filters":
        		break;
        	}
        	$listFilter.data('options_filter', attach);
        }

        // BCFTSGASDG-1606 - Shawn - Added
        // The default behaviour for clicking on a multi-selection is defined in
        // the createOverlayFromData() function. However, certain filters have
        // specialized behaviour (Such as pulling data from the global config).
        // This function allows easy, if not pretty, definition of custome filters.
        // All one has to do is identify their custom filter with a unique data-id
        // and then attach their desired handler to the 'click_handler'
        function attachClickAction($listFilter) {
            switch ($listFilter.attr('data-id')) {
            case "sectors-add":
            	$listFilter.data('click_handler', function() {
            		var $field = $(this);
            		var overlayTitle = $field.attr('data-title');
            		var labels = [];
            		$.each(global.config['FORECAST_SECTOR'].data, function(key, data){
            			labels.push(data.label);
            		});
            		createOverlayOptionSelection(overlayTitle, labels, $field.list_filter('get_values'), function(selected){
            			$field.list_filter('set_values', selected);
            			$field.list_filter('refresh_display');
            			$field.change(); // Use jQuery to fire the change event
            		});
            	});
            	break;
            case "productCat-add":
            	$listFilter.data('click_handler', function() {
            		var $field = $(this);
            		var overlayTitle = $field.attr('data-title');
            		var options = [];
            		var labels = [];
            		var selected = [];
            		$.each(global.config['PRODUCT_CATEGORY'].data, function(key, data){
            			options.push(key);
            			labels.push(data.label);
            		});
            		$.each($field.list_filter('get_values'), function(key, data){
            			selected.push(data[0]);
            		});
            		createOverlayOptionSelection(overlayTitle, labels, selected, function(selected){
            			$field.list_filter('set_values', selected);
            			$field.list_filter('refresh_display');
            			$field.change(); // Use jQuery to fire the change event
            		}, false, options);
            	});
            	break;
            case "probability-add":
                $listFilter.data('click_handler', function() {
                    var $field = $(this);
                    var overlayTitle = $field.attr('data-title');
                    var data = [];
                    var sortedProbability = [];
                    var categories = global.config['FORECAST_PROBABILITY'].data;
                    $.each(categories, function(i, v) {
                        if (v.status == 'active') {
                            sortedProbability.push(v)
                        }
                    });
                    sortedProbability.sort(function(a, b) {
                        return a.seq - b.seq;
                    });
                    $.each(sortedProbability, function(i, v) {
                        data.push(v.label)
                    });
                    createOverlayOptionSelection(overlayTitle, data, $field.list_filter('get_values'), function(selected) {
                        $field.list_filter('set_values', selected);
                        $field.list_filter('refresh_display');
            			$field.change(); // Use jQuery to fire the change event
                    });
                });
                break;
            case "leadSource-add":
            case "oppOwner-add":
            	break; // Theese are special and are handled by a separate event handler further down
            case "country-add":
            	// WARNING: Hack Ahead
            	// Because of the peculiarities of the country filter, it was
            	// decided to hardcode this filter for the BST filters pane
            	// Hopefully this will not be a permanent state of affairs
            	if( $listFilter.attr('data-context') == 'bst-mgmt-report' ) {
                	$listFilter.data('click_handler', function() {
                		var $field = $(this);
                		var overlayTitle = $field.attr('data-title');
                		var labels = ['Canada', 'US']; // Options are hardcoded
                		createOverlayOptionSelection(overlayTitle, labels, $field.list_filter('get_values'), function(selected){
                			$field.list_filter('set_values', selected);
                			$field.list_filter('refresh_display');
                			$field.change(); // Use jQuery to fire the change event
                		});
                	});
                	break;
            	}
            	// If the data-context is not bst-mgmt-report, fall through to default
            default:
                $listFilter.data('click_handler', createOverlayFromData($listFilter));
            }
        }

        var $reportFilters = $('#'+filterID+' [data-role="list_filter"]'
        		+',#'+filterID+' [data-role="personnel-selection-overlay"]');

        // Initialize them all as multiselection_options
        $reportFilters.each(function(index, filter) {
            $(filter).list_filter({
                filter_type: 'multiselection_options',
                reset: function() {
                    $(this).list_filter('set_values', []);
                    $(this).list_filter('refresh_display');
                },
                refresh_display: function() {
                    var html = '';
                    var selected = $(this).list_filter('get_values');
                    if (selected.length <= 0) {
                        html = '(all)';
                    } else {
                        $.each(selected, function(index, val) {
                            html = html ? html + ', ' : html;// Decide whether or not the next item should be preceded by a comma
                            if (val instanceof Array) {
                                html += val[0];
                            } else if (val instanceof Object) {
                                html += val.label;
                            } else {
                                html += val;
                            }
                        });
                    }
                    $(this).html(html);
                }
            });
            // BCFTSGASDG-1604 - Shawn - Added
            // Realized that certain filters, such as territories, will show
            // different options  under different runtime situations. This
            // function will allow this to happen
            attachOptionsFilter($(this));
            // BCFTSGASDG-1604 - Shawn - Added
            // Realized that under different circumstances, the filters
            // might also need to different click event handlers. This
            // function will allow this
            attachClickAction($(this));
        });

        // Bindings for when the user clicks on any of the multiselectors
        // Once again, personnel-selection-overlays are handled further down
        body.on('click', '#'+filterID+' [data-role="list_filter"]', function() {
            if ($(this).data('click_handler')instanceof Function) {
                $(this).data('click_handler').apply(this);
            }
        });

        // Bindings on the selectors to show the second input field when the
        // "between" comparator is selected
        body.on('change', '#'+filterID+' [data-id="closedDate-comparison"], #'+filterID+' [data-id="oppVal-comparison"]',
        		function() {
		            var $context = $(this).closest('.filterLayer[data-id]');
		            var data_id = $(this).attr('data-id');
		            if ($(this).val() == 'BN') {
		                $('[data-id="' + data_id + '-and"]', $context).show().parent().addClass('multiValueActive');
		            } else {
		                $('[data-id="' + data_id + '-and"]', $context).hide().parent().removeClass('multiValueActive');
		            }
		        }
        );

        body.on('change', '#'+filterID+' [data-id]', function(){
        	var dataID = $(this).closest('.filterLayer[data-id]').attr('data-id');
        	global.reportFilterManagers[filterID].alert(dataID);
        });
    }

	return function(body) {
		// init_reports START
		// BCFTSGASDG-1530
		resetReportFilters = function(reloadlist) {
			report_filters = {
				smonth : 1,
				emonth : 12,
				region : [],
				territory : [],
				PH1 : [],
				PH2 : [],
				PH3 : [],
				PH4 : [],
				distributor : [],
				country : [],
				salesarea : [],
				view_as : viewAsOverlay.getListFilters()
			}

			if (reloadlist) {
				var sidenavfilterid = global.currentpage.sidenavfilterid();
				sidenav.collapse('filter');
				$('#' + sidenavfilterid).find("select[data-id='filter_names']")
						.val("");
				$('#' + sidenavfilterid).find(
						"button[button-id='filter_delete']").hide();
				setReportFilters(report_filters);
				global.currentlist.clearfilters();
			}

			// 1558 Display all but select sales area filter specific to user
			// (TSM)
			// report_filters.salesarea.push(global.user.salesarea);
			if (global.user.access.allreportdataaccess == 'N') {
				getSelectionOverlayData(
						"salesarea",
						report_filters,
						function(r) {
							report_filters["salesarea"] = new Array(
									global.user.salesarea);
							setReportFilters(report_filters);
							$(
									'#report-filters [data-role="report-selection-overlay"][data-id="salesarea"]')
									.html(report_filters["salesarea"]);
							if (global.currentlist != undefined)
								global.currentlist.getNewData();
						});
			}

			$('#report-filters [data-role="report-selection-overlay"]').html(
					'(all)');
			$('#filters-reportmonth-smonth').val(report_filters.smonth);
			$('#filters-reportmonth-emonth').val(report_filters.emonth);

		}

		// BCFTSGASDG-1415 -- Added Project tracking filters
		resetPrjTrackReportFilters = function(reloadlist) {
			prjtrack_report_filters = {
				region : [],
				territory : [],
				productcategory : [],
				sector : [],
				probability : [],
				opp_value : '',
				opp_date : '',
				tracked_by : [],
				opp_owner : [],
				country : [],
				salesarea : [],
				view_as : viewAsOverlay.getListFilters()
			}
			$('[data-role="prjtrack-report-selection-overlay"]').html('(all)');
			$('[data-role="prjtrack-report-selection-overlay-config"]').html(
					'(all)');
			$(
					'#prjtrack-report-filters [data-role="personnel-selection-overlay"]')
					.html('(all)'); // Reset ALL personnel selection filters

			$('#filters-prjtrack-checkbox1').attr('checked', false);
			$('#filters-prjtrack-checkbox2').attr('checked', false);
			$('#filters-prjtrack-oppvalue-1').val("");
			$('#filters-prjtrack-oppvalue-2').val("");
			$('#filters-prjtrack-oppdate-1').val("");
			$('#filters-prjtrack-oppdate-2').val("");

			if (reloadlist) {
				var sidenavfilterid = gloabl.currentpage.sidenavfilterid();
				sidenav.collapse('filter');
				$('#' + sidenavfilterid).find("select[data-id='filter_names']")
						.val("");
				$('#' + sidenavfilterid).find(
						"button[button-id='filter_delete']").hide();
				setPrjTrackReportFilters(prjtrack_report_filters);
				global.currentlist.clearfilters();
			}

		}

		resetReportFilters();
		setReportFilters(report_filters);

		/* BCFTSGASDG-1606 - OBSOLETE
		resetMgmtReportFilters();
		setMgmtReportFilters(mgmt_report_filters);
		*/

		// BCFTSGASDG-1415
		resetPrjTrackReportFilters();
		setPrjTrackReportFilters(prjtrack_report_filters);


        // BCFTSGASDG-1606 - Shawn
        initializeReportFilterManagers();

		// BCFTSGASDG-1605
		// BCFTSGASDG-1606 - Shawn - Updated
		initializeReportListFilters(body, 'mgmt-report-filters', global.database.Main + '/getReportOptions?OpenAgent');
		initializeReportListFilters(body, 'bst-sales-report-filters', global.database.Main + '/getBSTReportOptions?OpenAgent');
		initializeReportListFilters(body, 'bst-mgmt-report-filters', global.database.Main + '/getBSTReportOptions?OpenAgent');


        // BCFTSGASDG-1605 - BST report filter apply and reset button bindings
        body.on('click', '[data-id="bstsalesreport-filter-apply"]', function() {
            global.currentlist.updateFilters();
            // This calls getNewData() also
            sidenav.collapse('filter');
        });

        body.on('click', '[data-id="bstsalesreport-filter-reset"]', function() {
            global.currentlist.clearfilters();
            // This calls getNewData() also
            sidenav.collapse('filter');
        });


		body.on('click', '#side-nav-reports-menu li[data-id="reports"]', function() {
			global.pages.reports.load();
		});

		// BCFTSGASDG-1605
		body.on('click', '#side-nav-reports-menu li[data-id="bstreports"]', function() {
			global.pages.bstreports.load();
		});

		body.on('click', '#side-nav-reports-menu li[data-id="growthInitiatives"]', function() {
			set_global_initiative( function() {
				global.pages.growthInitiatives.reload( {
					season : 2016
				});
			}, 2016)
		});

		body.on('click', '#side-nav-reports-menu li[data-id="growthInitiatives2017"]', function() {
			set_global_initiative( function() {
				global.pages.growthInitiatives.reload( {
					season : 2017
				});
			}, 2017)
		});

		// BCFTSGASDG-1415 -- Project Tracking Report
		body.on('click', '#side-nav-reports-menu li[data-id="prjtrackreport"]', function() {
			global.pages.prjtrackreport.load();
		});

		body.on('click', '#side-nav-reports-menu li[data-id="growthInitiatives-reports"]', function() {
			global.pages.gi_reports.load( {
				season : 2016
			});
		});

		// BCFTSGASDG-1332 -- GI Reports 2017
		body.on('click', '#side-nav-reports-menu li[data-id="growthInitiatives-reports-2017"]', function() {
			global.pages.gi_reports_2017.load( {
				season : 2017
			});
		});

		body.on('click', '#side-nav-reports-menu li[data-id="mgmt-reports"]', function() {
			global.pages.mgmtreports.load();
		});

		// BCFTSGASDG-1608 - Shawn - BST Management reports
		body.on('click', '#side-nav-reports-menu li[data-id="bst-mgmt-reports"]', function() {
			global.pages.bst_mgmtreports.load();
		});

		// BCFTSGASDG-1606 - OBSOLETE, MUST UPDATE
		body.on('change', 'select[data-id="mr-oppvalue-selection"]', function() {
			var data_type = $(this).attr('data-type'); // Either 'bst' or ''
			var filterManager = global.reportFilterManagers[(data_type == 'bst' ? 'bst-':'')+'mgmt-report-filters'];
			mgmtrep_getoppdata({
				listType : this.value,
				report_type : data_type,
				filterManager : filterManager
			});
		});

		body.on('change', 'select[data-id="mr-prtrk-detail-selection"]', function() {
			/* BCFTSGASDG-1606 - OBSOLETE
			setMgmtReportFiltersListType(this.value);
			*/
			global.currentlist.updateFilters({
				// Makes the list recalculate its filters
				// The argument is an object which the function will use to extend
				// whatever filter object it itself creates
				listType : this.value
			});
			global.currentlist.getNewData();
			/* BCFTSGASDG-1607
			 * This has become unecessary. The backend agent will take care of making the right column model from now on.
			switch (this.value) {
			case 'trackprojbysector':
				global.currentlist.columnModel[1].alias = 'Sector';
				break;
			case 'trackprojbyprodcat':
				global.currentlist.columnModel[1].alias = 'Product Category';
				break;
			default:
				// global.currentlist.columnModel[1].alias='Region';
				global.currentlist.columnModel[1].alias = 'Sales Area';
				break;
			}
			*/
		});

		// BCFTSGASDG-1608 - Bindings for view by, and year toggle on Activity
		// Summary - Vishaal
		body.on('change', '#act_sum_region_firm', function() {
			// alert($(this).val());
				// global.currentlist.filters = $("#act_sum_region_firm")
				global.currentlist.filters.add("viewBy", $(this).val());
				global.currentlist.getNewData();
			});

		body.on('click', '#act_sum_year_toggle', function() {
			// alert($(this).val());
				// alert($("#act_sum_year_toggle
				// li.optionButton.active").attr("data-value"));
				global.currentlist.filters.add("year", $(
						"#act_sum_year_toggle li.optionButton.active").attr(
						"data-value"));
				global.currentlist.getNewData();
			});

		body.on('click', '#side-nav-reports li[data-id="export"], #side-nav-gi-reports li[data-id="export"],#side-nav-gi-reports-2017 li[data-id="export"], #side-nav-mgmt-tracking-reports li[data-id="export"], #side-nav-mgmt-reports li[data-id="export"]',function() {
			// As listname is changed to sales_report - Manish
			// 5/25/2017
			// if(global.currentlist.listName=="reportsCurrentProgression")
			if (global.currentlist.constructor.name == "List") {
				var data = $
						.extend(
								{},
								global.currentlist.query,
								{
									filters : JSON
											.stringify(global.currentlist.filters),
									sorts : JSON
											.stringify(global.currentlist.sorts)
								});
				window.location = global.currentlist.dataSource
						+ "&excel=1&" + $.param(data);
			} else {
				global.pages.export_to_excel.load( {
					list : global.currentlist
				});
			}

		});

		body.on('click', '#side-nav-gi-reports-2017 li[data-id="download"]',
				function() {
					global.pages.gi_reports_download.load();
				});

		body.on('click', 'ul[data-role="report-selection"] li:not(.active)',
				function(e) {
					// Added - 03/30/2016 - Helen Schroeder - Added
				// :not(.active) to prevent rapid clicking on a tab, which
				// causes a spinning wheel in IE
				global.pages.reports.load( {
					pageid : $(this).attr('page-id')
				});
			});

		body.on('click',
				'ul[data-role="mgmtreport-selection"] li:not(.active)',
				function(e) {
				// BCFTSGASDG-1608 - Shawn - Updated
				// Changed from specifying mgmtreports to just simply
				// currentpage. Relies on the invariant that the tabs
				// are only available on either the mgmtreports page
				// and the bst_mgmtreports page
				global.currentpage.load( {
					pageid : $(this).attr('page-id')
				});
			});

		/* BCFTSGASDG-1606 - OBSOLETE
		body.on('click', '[data-role="report-selection-overlay"], [data-role="mgmt-report-selection-overlay"], [data-role="prjtrack-report-selection-overlay"]', function(e) {
		*/
		body.on('click', '[data-role="report-selection-overlay"], [data-role="prjtrack-report-selection-overlay"]', function(e) {
            var $field = $(this);
            var value_type = $field.attr('data-id');
            var data_role = $field.attr('data-role');
            resetViewAsFilter(data_role);

            var selected_filters;
            /* BCFTSGASDG-1606 - OBSOLETE
            if (data_role == "mgmt-report-selection-overlay") {
                selected_filters = mgmt_report_filters;
            } else if (data_role == "prjtrack-report-selection-overlay") {
                selected_filters = prjtrack_report_filters;
            } else {
                selected_filters = report_filters;
            }
            */
            if (data_role == "prjtrack-report-selection-overlay") {
                selected_filters = prjtrack_report_filters;
            } else {
                selected_filters = report_filters;
            }

            getSelectionOverlayData(value_type, selected_filters, function(response) {
                if (response.status == 'success') {
                	/* BCFTSGASDG-1606 - OBSOLETE
                    if (data_role == "mgmt-report-selection-overlay") {
                        createOverlayOptionSelection($field.attr('data-title'), response.data, mgmt_report_filters[value_type], function(selected_values) {
                            mgmt_report_filters[value_type] = selected_values;
                            $field.html(mgmt_report_filters[value_type].length == 0 ? '(all)' : mgmt_report_filters[value_type].join(', '));
                        });
                    } else if (data_role == "prjtrack-report-selection-overlay") {
                    */
                	if( data_role == 'prjtrack-report-selection-overlay' ) {
                        createOverlayOptionSelection($field.attr('data-title'), response.data, prjtrack_report_filters[value_type], function(selected_values) {
                            prjtrack_report_filters[value_type] = selected_values;
                            $field.html(prjtrack_report_filters[value_type].length == 0 ? '(all)' : prjtrack_report_filters[value_type].join(', '));
                        });
                    } else {
                        createOverlayOptionSelection($field.attr('data-title'), response.data, report_filters[value_type], function(selected_values) {
                            report_filters[value_type] = selected_values;
                            $field.html(report_filters[value_type].length == 0 ? '(all)' : report_filters[value_type].join(', '));
                        });
                    }

                    // Added - 04/18/2016 - Helen
                    // Schroeder - Added to reset the
                    // scrollbar
                    $('.overlay-selection-item-container').scrollTop(0);

                } else {
                    // TO DO ANDREW
                    alert('error');
                }
            });
        });

        // BCFTSGASDG-1415 -- Added Project Tracking Report
        // BCFTSGASDG-1582 -- Added Activities function for Company Profile
        // BCFTSGASDG-1606 -- Bindings revised to use a common data-role,
        // "personnel-selection-overlay"
        body.on('click', '[data-role="personnel-selection-overlay"]', function() {
            var $field = $(this);
            var data_context = $field.attr('data-context');// This is the "primary" identifier
            var data_id = $field.attr('data-id');// This is the "secondary" identifier
            var data_title = $field.attr('data-title');// This is used for the header of the overlay

            // Build the overlay html
            var html = '<div data-role="overlay-selection" class="overlay-selection nonEditAccessSection">' + '<h2>' + data_title + '</h2>' + '<div class="overlay-selection-grid-container">' + '<div id="overlay_selection_grid" style="height: 350px"></div>' + '<div class="overlay-selection-button-container">' + '<button class="button" data-id="overlay-selection-save" type="button">Save</button>' + '<button class="button" type="button" onclick="hidePop();">Cancel</button>' + '</div>' + '</div>' + '</div>';

            showPopDialog(html, 600, 0, 0);
            var $overlay = $('#popUpDef [data-role="overlay-selection"]');

            // Decide, based on data_context and data_id, which
            // items should already be selected
            var selected = [];
            switch (data_context) {
            /* BCFTSGASDG-1606 - OBSOLETE
            case "mgmt-report":
                // data_id should be one of ['opp_owner', 'lead_source']
                $.each(mgmt_report_filters[data_id], function(index, value) {
                    selected.push(value);
                });
                break;
                */
            case "mgmt-report":
            case "bst-mgmt-report":
                // BST mgmt report filters utilize the list_filter method
                selected = $field.list_filter('get_values');
                break;
            case "prjtrack-report":
                // data_id should be one of ['opp_owner', 'tracked_by']
                $.each(prjtrack_report_filters[data_id], function(index, value) {
                    selected.push(value);
                });
                break;
            case "activity":
                // Entirely different behaviour
                if (!$.isEmptyObject(activity_affiliate)) {
                    $.each(activity_affiliate, function(index, value) {
                        selected.push(value)
                    });
                }
                break;
            }

            // BCFTSGASDG-1487 - Changed grid to Sales Structure
            var grid = new selectionGrid({
                container: $('#overlay_selection_grid')[0],
                fetch: {
                    schedule: "all",
                    rows: 5
                },
                tableClass: 'list-template-main list-template1',
                paging: "scroll",
                categorized: true,
                selected: selected,
                dataSource: global.database.Main + '/(getOpportunityOwners)?OpenAgent',
                height: 250,
                defaultFilters: function() {
                    if (data_context == "mgmt-report") {
                    	/*
                        this.filters.add('salesarea', mgmt_report_filters.salesarea);
                        this.filters.add('region', mgmt_report_filters.region);
                        */
                    	var context_filters = global.reportFilterManagers['mgmt-report-filters'].getFilters();
                    	this.filters.add('salesarea', context_filters.salesArea);
                    	this.filters.add('region', context_filters.regions);
                    } else {
                        this.filters.add('salesarea', prjtrack_report_filters.salesarea);
                        this.filters.add('region', prjtrack_report_filters.region);
                    }
                },
                getSelectionKey: function(data, depth) {
                    data = data || {};
                    return data.employeeID;
                },
                getSelectionLabel: function(data, depth) {
                    data = data || {};
                    return data.label;
                },
                getSelectionIsCategory: function(data, depth) {
                    data = data || {};
                    return data.isCategory;
                },
                onRowSelect: function(data, indices, selected) {
                    this.displayGrid();
                },
                addToSelectionFunction: function(key, data, selected) {
                    if (key !== undefined) {
                        selected.push({
                            label: data.userName,
                            key: key
                        });
                    }
                },
                columnModel: [{
                    name: 'label',
                    label: 'Name',
                    frozen: false,
                    renderCell: function(data, i, depth) {
                        if (depth === 0) {
                            return data.salesArea;
                        } else if (depth === 1) {
                            return data.regionName;
                        } else if (depth === 2) {
                            return data.userName;
                        }
                    }
                }]
            });

            $('button[data-id="overlay-selection-save"]', $overlay).click(function() {
                var selected_values = [];

                // BCFTSGASDG-1496 -- Only take selected
                // users are in filtered region and
                // sales area
                $.each(grid.selected, function(index, value) {
                    for (var index2 in grid.options.idList) {
                        if (grid.selected[index].key == grid.options.idList[index2]) {
                            selected_values.push(grid.selected[index]);
                            return;
                        }
                    }
                });
                grid.selected = selected_values;

                // Apply the selected items according to
                // data_context and data_id
                switch (data_context) {
                /* BCFTSGASDG-1606 - OBSOLETE
                case "mgmt-report":
                    mgmt_report_filters[data_id] = selected_values;
                    if (mgmt_report_filters[data_id].length == 0) {
                        $field.html('(all)')
                    } else {
                        var arrSelectedLabel = [];
                        $.each(mgmt_report_filters[data_id], function(index, value) {
                            arrSelectedLabel.push(value.label)
                        });
                        $field.html(arrSelectedLabel.join(', '));
                    }
                    break;
                    */
                case "mgmt-report":
                case "bst-mgmt-report":
                    $field.list_filter('set_values', selected_values);
                    $field.list_filter('refresh_display');
                    $field.change(); // Use jQuery to fire the change event
                    //global.reportFilterManagers[data_context+'-filters'].alert(data_id);
                    break;
                case "prjtrack-report":
                    prjtrack_report_filters[data_id] = selected_values;
                    if (prjtrack_report_filters[data_id].length == 0) {
                        {
                            $field.html('(all)')
                        }
                    } else {
                        var arrSelectedLabel = [];
                        $.each(prjtrack_report_filters[data_id], function(index, value) {
                            arrSelectedLabel.push(value.label)
                        });
                        $field.html(arrSelectedLabel.join(', '));
                    }
                    break;
                case "activity":
                    global.currentActivities.current_activity.data['affiliate'] = selected_values;
                    var $display = $('[data-id="affiliate_name"]');
                    if ($.isEmptyObject(global.currentActivities.current_activity.data['affiliate'])) {
                        {
                            $display.html('SELECT AFFILIATES')
                        }
                    } else {
                        var arrSelectedLabel = [];
                        $.each(global.currentActivities.current_activity.data['affiliate'], function(index, value) {
                            arrSelectedLabel.push(value.label)
                        });
                        if (arrSelectedLabel.length > 2) {
                            $display.html(arrSelectedLabel[0] + ', ' + arrSelectedLabel[1] + ', ...')
                        } else {
                            $display.html(arrSelectedLabel.join(', '));
                        }
                    }
                    break;
                }
                hidePop();
            });
        });

		// BCFTSGASDG-1415 -- Added Project Tracking Report
        /* BCFTSGSDG-1606 - OBSOLETE
		body.on('click', '[data-role="mgmt-report-selection-overlay-config"],[data-role="prjtrack-report-selection-overlay-config"]', function(e) {
		*/
        body.on('click', '[data-role="prjtrack-report-selection-overlay-config"]', function(e) {
			var $input = $(this);
			var data = [];
			var value_type = $input.attr('data-id');
			var data_role = $input.attr('data-role');

			if ($input.attr("data-id") == "sector") {
				for ( var k in global.config.FORECAST_SECTOR.data) {
					var o = global.config.FORECAST_SECTOR.data[k];
					data.push(o.label);
				}
			} else if ($input.attr("data-id") == "productcategory") {
				for ( var k in global.config.PRODUCT_CATEGORY.data) {
					var o = global.config.PRODUCT_CATEGORY.data[k];
					data.push(o.label);
				}
			} else if ($input.attr("data-id") == "probability") {

				var sortedProbability = [];
				var categories = global.config['FORECAST_PROBABILITY'].data;
				$.each(categories, function(i, v) {
					if (v.status == 'active') {
						sortedProbability.push(v)
					}
				});

				sortedProbability.sort( function(a, b) {
					return a.seq - b.seq;
				});

				$.each(sortedProbability, function(i, v) {
					data.push(v.label)
				});
			}

			if (data.length != 0) {
				/* BCFTSGASDG-1606 - OBSOLETE
				if (data_role == "mgmt-report-selection-overlay-config") {
					createOverlayOptionSelection(
							$input.attr('data-title'),
							data,
							mgmt_report_filters[value_type],
							function(selected_values) {
								mgmt_report_filters[value_type] = selected_values;
								$input
										.html(mgmt_report_filters[value_type].length == 0 ? '(all)'
												: mgmt_report_filters[value_type]
														.join(', '));
							});
				} else {
				*/
				createOverlayOptionSelection(
						$input.attr('data-title'),
						data,
						prjtrack_report_filters[value_type],
						function(selected_values) {
							prjtrack_report_filters[value_type] = selected_values;
							$input
									.html(prjtrack_report_filters[value_type].length == 0 ? '(all)'
											: prjtrack_report_filters[value_type]
													.join(', '));
						});
			}
		});

		// GI Reports 2016 buttons binding
		body.on('click', 'ul[data-role="gi_report-sectors"] li', function(e) {
			// Le Trong - JIRA# BCFTSGASDG-957
				reports_calendar.calendar.gi_season = $(this).parent().attr(
						'data-season');
				var selected_date = reports_calendar.calendar.selected_date
						|| (new Date());
				var repYear = selected_date.getFullYear();
				var repMonth = selected_date.getMonth() + 1;
				var title = $(this).data('title');

				// BCFTSGASDG-1407 Disabling the 2017 dates
				if (repYear == 2017) {
					// repYear=$(this).parent().attr('data-season');
				// reports_calendar.calendar.selected_date.setYear(selected_date.getFullYear()-1);
				repYear = 2016
				repMonth = 12
				/*
				 * NOTE: The day doesn't really matter here, only the month.
				 * Date should be set to the smallest number of days in a month,
				 * not 31st. Otherwise an issue will occur when user changes
				 * between months since some months don't go up to 31st.
				 */
				// reports_calendar.calendar.selected_date=new Date("Dec 31,
				// 2016 23:59:59")
				reports_calendar.calendar.selected_date = new Date(
						"Dec 27, 2016 23:59:59")
			}

			global.pages.gi_reports_scoreboard.load( {
				init_id : $(this).data('initid'),
				title : title,
				repyear : $(this).parent().attr('data-season'),
				repmonth : repMonth
			});
		});

		// GI Reports 2016 tabs binding
		body.on('click', 'ul[data-role="gi-report-selection"] li:not(.active)',
				function(e) {
					// Le Trong - JIRA# BCFTSGASDG-957
				reports_calendar.calendar.gi_season = $('.gi_reports').find(
						'ul[data-role="gi_report-sectors"]')
						.attr('data-season');
				var selected_date = reports_calendar.calendar.selected_date
						|| (new Date())
				var repYear = selected_date.getFullYear();
				var repMonth = selected_date.getMonth() + 1;
				var title = $('#gi_reports_scoreboard_header').html();

				// BCFTSGASDG-1407 Disabled 2017 GI Report for all other reports
				// except project tracking
				if ($(this).attr('page-id') !== "tracking_projects"
						&& repYear == 2017) {
					// repYear=$('.gi_reports').find('ul[data-role="gi_report-sectors"]').attr('data-season');
					// reports_calendar.calendar.selected_date.setYear(selected_date.getFullYear()-1);

					// repYear=2016
					// repMonth=12
					// reports_calendar.calendar.selected_date=new Date("Dec 27,
					// 2016 23:59:59")
					reports_calendar.calendar.navigation('0', 'season');
					return;
				}

				global.pages.gi_reports_scoreboard.load( {
					init_id : $(this).attr('init-id'),
					pageid : $(this).attr('page-id'),
					title : title,
					repyear : repYear,
					repmonth : repMonth
				});
			});

		// BCFTSGASDG-1332 -- GI reports 2017 bindings
		// GI Reports 2017 tabs
		body
				.on(
						'click',
						'ul[data-role="gi-report-2017-selection"] li:not(.active)',
						function(e) {
							// don't show Closed Projects under Project Profile
							// tab
							var title = $('.gi_reports_2017')
									.find(
											'ul[data-role="gi-report-2017-selection"] li.active')
									.attr('page-id');
							if (title === 'product_portfolio_2017') {
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="close_projects"]')[0])
										.hide();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="project_pipeline"]')[0])
										.hide();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="skill_testing_series"]')[0])
										.hide();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="expand_contractor_network"]')[0])
										.hide();
							} else if (title === 'ucrete_plus_2017') {
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="project_pipeline"]')[0])
										.hide();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="skill_testing_series"]')[0])
										.show();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="expand_contractor_network"]')[0])
										.show();
							} else {
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="close_projects"]')[0])
										.show();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="project_pipeline"]')[0])
										.show();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="skill_testing_series"]')[0])
										.hide();
								$(
										$('ul[data-role="gi_report_2017-sectors"] li[page-id="expand_contractor_network"]')[0])
										.hide();
							}
						});

		// GI Reports 2017 buttons
		body.on('click', 'ul[data-role="gi_report_2017-sectors"] li', function(
				e) {
			// add active class to selected button
				$('ul[data-role="gi_report_2017-sectors"]').removeClass(
						'active');
				$(this).addClass('active');

				reports_calendar.calendar.gi_season = $(this).parent().attr(
						'data-season');
				var selected_date = reports_calendar.calendar.selected_date
						|| (new Date())
				var repYear = selected_date.getFullYear();
				var repMonth = selected_date.getMonth() + 1;
				var activeTab = $(this).closest('div.content-area').siblings(
						'div.headerPane').find(
						'ul[data-role="gi-report-2017-selection"] li.active');
				var title = activeTab.attr('page-id');
				var initId = activeTab.attr('data-initid');

				// if current selected_date is 2016, update to current date of
				// 2017
				if (repYear == 2016) {
					reports_calendar.calendar.selected_date = new Date();
					repMonth = reports_calendar.calendar.selected_date
							.getMonth() + 1;
					repYear = reports_calendar.calendar.selected_date
							.getFullYear();
				}

				global.pages.gi_reports_2017_scoreboard.load( {
					init_id : initId,
					pageid : $(this).attr('page-id'),
					pageTitle : $(this).text(),
					titleid : title,
					repyear : $(this).parent().attr('data-season'),
					repmonth : repMonth
				});
			});

		body.on('change', '#filters-reportmonth-smonth', function() {
			report_filters.smonth = $(this).val();
		});

		body.on('change', '#filters-reportmonth-emonth', function() {
			report_filters.emonth = $(this).val();
		});

		// BCFTSGASDG-1415 -- Update est closed date and opp val for
        // prjtrack_report_filters, then save or apply changes
        body.on('click', '#prjtrack-report-filters [button-id="filter_save"], [data-id="prjtrack-report-filter-apply"], #report-filters [button-id="filter_save"]', function() {
            //
            var data_id = $(this).attr('data-id');

            if ($('#filters-prjtrack-checkbox1').is(":checked")) {
                if ($('#filters-prjtrack-comparison').val() == "BN") {
                    prjtrack_report_filters.opp_value = $('#filters-prjtrack-oppvalue-1').val() + $('#filters-prjtrack-comparison').val() + $('#filters-prjtrack-oppvalue-2').val();
                } else {
                    prjtrack_report_filters.opp_value = $('#filters-prjtrack-oppvalue-1').val() + $('#filters-prjtrack-comparison').val();
                }
            } else {
                prjtrack_report_filters.opp_value = '';
            }
            if ($('#filters-prjtrack-checkbox2').is(":checked")) {
                if ($('#filters-prjtrack-comparison2').val() == "BN") {
                    prjtrack_report_filters.opp_date = $('#filters-prjtrack-oppdate-1').val() + $('#filters-prjtrack-comparison2').val() + $('#filters-prjtrack-oppdate-2').val();
                } else {
                    prjtrack_report_filters.opp_date = $('#filters-prjtrack-oppdate-1').val() + $('#filters-prjtrack-comparison2').val();
                }
            } else {
                prjtrack_report_filters.opp_date = '';
            }

            if (data_id == 'prjtrack-report-filter-apply') {
                // apply
                prjtrack_applyFilters();
            } else {
                // save
                savedFilters_Save(true);
            }
        });

        /* BCFTSGASDG-1606 - OBSOLETE
        body.on('click', '[data-id="report-filter-apply"], [data-id="mgmt-report-filter-apply"]', function() {
            var data_id = $(this).attr('data-id');
            if (data_id == 'mgmt-report-filter-apply') {
                if ($('#filters-mgmt-checkbox1').is(":checked")) {
                    if ($('#filters-mgmt-comparison').val() == "BN") {
                        mgmt_report_filters.opp_value = $('#filters-mgmt-oppvalue-1').val() + $('#filters-mgmt-comparison').val() + $('#filters-mgmt-oppvalue-2').val();
                    } else {
                        mgmt_report_filters.opp_value = $('#filters-mgmt-oppvalue-1').val() + $('#filters-mgmt-comparison').val();
                    }
                } else {
                    mgmt_report_filters.opp_value = '';
                }

                if ($('#filters-mgmt-checkbox2').is(":checked")) {
                    if ($('#filters-mgmt-comparison2').val() == "BN") {
                        mgmt_report_filters.opp_date = $('#filters-mgmt-oppdate-1').val() + $('#filters-mgmt-comparison2').val() + $('#filters-mgmt-oppdate-2').val();
                    } else {
                        mgmt_report_filters.opp_date = $('#filters-mgmt-oppdate-1').val() + $('#filters-mgmt-comparison2').val();
                    }
                } else {
                    mgmt_report_filters.opp_date = '';
                }

                setMgmtReportFilters(mgmt_report_filters);
                var page_id = $('ul[data-role="mgmtreport-selection"] li.active').attr('page-id');

                if (page_id == 'opportunities' || page_id == 'prj_summary') {
                    global.pages.mgmtreports.load({
                        pageid: page_id
                    });
                } else {
                    $('#mr-prtrk-summ-list').html('');// added to wipe out the summary report if no data is returned
                    global.currentlist.getNewData();
                }
            } else {
                setReportFilters(report_filters);
                global.currentlist.getNewData();
            }
            sidenav.collapse('filter');
        });
        */

        function mgmtReportFiltersApply() {
        	var contentSelector = global.currentpage.getContentSelector(); // Must define a narrower scope since there are more than one mgmtreport-selection tabs
          var page_id = $('ul[data-role="mgmtreport-selection"] li.active', $(contentSelector)).attr('page-id');
          if( page_id == 'opportunities' || page_id == 'prj_summary' ) {
          	//global.pages.mgmtreports.load({
          	global.currentpage.load({ // Changed to currentpage to allow dynamic switching between BST and CS
          		pageid: page_id
          	});
          } else { // page_id == 'tracking'
          	global.currentlist.updateFilters();
          	global.currentlist.getNewData();
          }
          sidenav.collapse('filter');
        }
        body
        	.on('click', '[data-id="mgmt-report-filter-apply"]', function(){
	        	mgmtReportFiltersApply();
        	})
        	.on('click', '[data-id="mgmt-report-filter-reset"]', function() {
        		// Functionally, the reset button is exactly the same as the apply
        		// button, except the filters are reset before they are applied
	        	var managerID = global.currentpage.pagecode == 'mgmtreports' ? 'mgmt-report-filters': 'bst-mgmt-report-filters';
	        	global.reportFilterManagers[managerID].resetFilters();
	        	mgmtReportFiltersApply();
	        });


        body.on('click', '[data-id="report-filter-apply"]', function() {
        	setReportFilters(report_filters);
        	global.currentlist.getNewData();
        	sidenav.collapse('filter');
        });
        /* BCFTSGASDG-1606 - OBSOLETE
        body.on('click', '[data-id="report-filter-reset"], [data-id="mgmt-report-filter-reset"]', function() {
            var data_id = $(this).attr('data-id')
            if (data_id == 'mgmt-report-filter-reset') {
                resetMgmtReportFilters();
                setMgmtReportFilters(mgmt_report_filters);

                var page_id = $('ul[data-role="mgmtreport-selection"] li.active').attr('page-id');
                if (page_id == 'opportunities' || page_id == 'prj_summary')
                    global.pages.mgmtreports.load({
                        pageid: page_id
                    });
                else
                    global.currentlist.getNewData();
            } else if (data_id == 'report-filter-reset') {
                resetReportFilters(true);
                if ($.inArray("TSM", global.user.access.roles) == -1) {
                    setReportFilters(report_filters);
                    global.currentlist.getNewData();
                }
            }
            sidenav.collapse('filter');
        });
        */
        body.on('click', '[data-id="report-filter-reset"]', function() {
            resetReportFilters(true);
            if ($.inArray("TSM", global.user.access.roles) == -1) {
                setReportFilters(report_filters);
                global.currentlist.getNewData();
            }
            sidenav.collapse('filter');
        });


		// BCFTSGASDG-1470 - Reset filter on viewAs
		body.on('click', '.nonEditAccessSection.viewAsDialog .button.save, .nonEditAccessSection.viewAsDialog #viewAsOptionsGrid .grid-selection', function() {
            resetReportFilters();
            setReportFilters(report_filters);
            /* BCFTSGASDG-1606 - OBSOLETE
            resetMgmtReportFilters();
            setMgmtReportFilters(mgmt_report_filters);
            */
            resetPrjTrackReportFilters();
            setPrjTrackReportFilters(prjtrack_report_filters);

            // Removed - 03/30/2016 - Helen Schroeder - This was
            // conflicting with the viewas menu and causing a
            // spinning wheel in IE
            // if (global.currentlist)
            // global.currentlist.getNewData();
            sidenav.collapse('filter');
        });

		/*
		 * body.on('mouseenter', '#report_salesrep_leaderboard .legendIcon',
		 * function() {
		 *
		 * html_add = '<div class="db-panel">' + '<div class="panel-header">' + '<h3>LEGEND</h3>' + '</div>' + '<div
		 * class="panel-content" style="max-height:none"><table>'+ '<tr><td><div
		 * class="colorbox cell-green"></div></td><td>100% - Complete</td></tr>'+ '<tr><td><div
		 * class="colorbox cell-yellow"></div></td><td>80% - 99.9%</td></tr>'+ '<tr><td><div
		 * class="colorbox cell-red"></div></td><td>< 80%</td></tr>'+ '</table>' '</div>';
		 * $('#report_salesrep_leaderboard .legendIconOvelay').html(html_add);
		 *
		 * });
		 *
		 * body.on('mouseleave', '#report_salesrep_leaderboard .legendIcon',
		 * function() { $('#report_salesrep_leaderboard
		 * .legendIconOvelay').html(''); });
		 */

		body.on('click', '.legendIcon', function() {
			$(".legendIconOverlay").toggle();
		});

		body.on('click', '.legendIconOverlay', function() {
			$(".legendIconOverlay").toggle();
		});

		// Add save filter option Sales Reporting
		sales_constructFilterObject = function() {
			global.currentlist.filters = new List_Map_Data();
			global.currentlist.defaultFilters();
			global.currentlist.filters.add('smonth', report_filters['smonth']);
			global.currentlist.filters.add('emonth', report_filters['emonth']);
			global.currentlist.filters.add('region', report_filters['region']);
			global.currentlist.filters.add('territory',
					report_filters['territory']);
			global.currentlist.filters.add('ph1', report_filters['ph1']);
			global.currentlist.filters.add('ph2', report_filters['ph2']);
			global.currentlist.filters.add('ph3', report_filters['ph3']);
			global.currentlist.filters.add('ph4', report_filters['ph4']);
			global.currentlist.filters.add('distributor',
					report_filters['distributor']);
			global.currentlist.filters
					.add('country', report_filters['country']);
			global.currentlist.filters.add('salesarea',
					report_filters['salesarea']);

			global.currentlist.filters.add('view_as', viewAsOverlay
					.getListFilters());
			global.currentlist.filters.add('listType', '');
		}

		sales_applyFilters = function() {
			setReportFilters(report_filters);
			sidenav.collapse('filter');
			global.currentlist.getNewData();
		}

		// Map saved filters to selected options in Sales Reporting
		sales_applySelectedFilter = function() {
			var filter_id = $('#' + global.currentpage.sidenavfilterid()).find(
					"select[data-id='filter_names']").val();

			resetReportFilters();
			setReportFilters(report_filters);

			if (filter_id != '') {
				var filter_obj = global.currentlist.savedfilters.data[filter_id].filters;

				$
						.each(
								filter_obj,
								function(key, value) {
									switch (key) {
									case 'smonth':
									case 'emonth':
										var $field = $('select[id="filters-reportmonth-' + key + '"]');
										$field.val(value);
										report_filters[key] = Number(value);
										selectRestyle('report-filters');
										break;

									case 'region':
										var $field = $('span[data-role="report-selection-overlay"][data-id="region"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['region'] = arr_label;
										}
										break;

									case 'territory':
										var $field = $('span[data-role="report-selection-overlay"][data-id="territory"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['territory'] = arr_label;
										}
										break;

									case 'ph1':
										var $field = $('span[data-role="report-selection-overlay"][data-id="ph1"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['ph1'] = arr_label;
										}
										break;

									case 'ph2':
										var $field = $('span[data-role="report-selection-overlay"][data-id="ph2"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['ph2'] = arr_label;
										}
										break;

									case 'ph3':
										var $field = $('span[data-role="report-selection-overlay"][data-id="ph3"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['ph3'] = arr_label;
										}
										break;

									case 'ph4':
										var $field = $('span[data-role="report-selection-overlay"][data-id="ph4"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['ph4'] = arr_label;
										}
										break;

									case 'distributor':
										var $field = $('span[data-role="report-selection-overlay"][data-id="distributor"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['distributor'] = arr_label;
										}
										break;

									case 'country':
										var $field = $('span[data-role="report-selection-overlay"][data-id="country"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['country'] = arr_label;
										}
										break;

									case 'salesarea':
										var $field = $('span[data-role="report-selection-overlay"][data-id="salesarea"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											report_filters['salesarea'] = arr_label;
										}
										break;
									} /* switch */
								}); /* each */
			} /* if(filter_id!='') */
			else {
				resetReportFilters();
				setReportFilters(report_filters);
			}
		}

		// BCFTSGASDG-1430 - Added for save filter option
		prjtrack_constructFilterObject = function() {
			global.currentlist.filters = new List_Map_Data();
			global.currentlist.defaultFilters();
			global.currentlist.filters.add('country',
					prjtrack_report_filters['country']);
			global.currentlist.filters.add('salesarea',
					prjtrack_report_filters['salesarea']);
			global.currentlist.filters.add('region',
					prjtrack_report_filters['region']);
			global.currentlist.filters.add('territory',
					prjtrack_report_filters['territory']);
			global.currentlist.filters.add('sector',
					prjtrack_report_filters['sector']);
			global.currentlist.filters.add('probability',
					prjtrack_report_filters['probability']);
			global.currentlist.filters.add('productcategory',
					prjtrack_report_filters['productcategory']);
			global.currentlist.filters.add('opp_value',
					prjtrack_report_filters['opp_value']);
			global.currentlist.filters.add('opp_date',
					prjtrack_report_filters['opp_date']);
			global.currentlist.filters.add('opp_owner',
					prjtrack_report_filters['opp_owner']);
			global.currentlist.filters.add('tracked_by',
					prjtrack_report_filters['tracked_by']);
			global.currentlist.filters.add('view_as', viewAsOverlay
					.getListFilters());
			global.currentlist.filters.add('listType', '');
		}

		// BCFTSGASDG-1430 - Added for save filter option
		prjtrack_applyFilters = function() {
			setPrjTrackReportFilters(prjtrack_report_filters);
			sidenav.collapse('filter');
			global.currentlist.getNewData();
		}

		// BCFTSGASDG-1430 - Added for save filter option
		prjtrack_applySelectedFilter = function() {
			var filter_id = $('#' + global.currentpage.sidenavfilterid()).find(
					"select[data-id='filter_names']").val();

			resetPrjTrackReportFilters();
			setPrjTrackReportFilters(prjtrack_report_filters);

			if (filter_id != '') {
				var filter_obj = global.currentlist.savedfilters.data[filter_id].filters;

				$
						.each(
								filter_obj,
								function(key, value) {
									switch (key) {

									case 'country':
										var $field = $('span[data-role="prjtrack-report-selection-overlay"][data-id="country"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['country'] = arr_label;
										}
										break;

									case 'salesarea':
										var $field = $('span[data-role="prjtrack-report-selection-overlay"][data-id="salesarea"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['salesarea'] = arr_label;
										}
										break;

									case 'region':
										var $field = $('span[data-role="prjtrack-report-selection-overlay"][data-id="region"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['region'] = arr_label;
										}
										break;

									case 'territory':
										var $field = $('span[data-role="prjtrack-report-selection-overlay"][data-id="territory"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['territory'] = arr_label;
										}
										break;

									case 'sector':
										var $field = $('span[data-role="prjtrack-report-selection-overlay-config"][data-id="sector"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['sector'] = arr_label;
										}
										break;

									case 'productcategory':
										var $field = $('span[data-role="prjtrack-report-selection-overlay-config"][data-id="productcategory"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['productcategory'] = arr_label;
										}
										break;

									case 'probability':
										var $field = $('span[data-role="prjtrack-report-selection-overlay-config"][data-id="probability"]');
										if (value.length > 0) {
											var arr_label = [];
											$.each(value,
													function(index, data) {
														arr_label.push(data);
													});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['probability'] = arr_label;
										}
										break;

									case 'tracked_by':
										var $field = $('span[data-role="prjtrack-report-selection-overlay-trackedby"]');
										if (value.length > 0) {
											var arr_label = [];
											var arr_obj = [];
											$
													.each(
															value,
															function(index,
																	object) {
																arr_label
																		.push(value[index].label);
																arr_obj
																		.push(value[index]);
															});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['tracked_by'] = arr_obj;
										}
										break;

									case 'opp_owner':
										var $field = $('span[data-role="prjtrack-report-selection-overlay-oppowner"]');
										if (value.length > 0) {
											var arr_label = [];
											var arr_obj = [];
											$
													.each(
															value,
															function(index,
																	object) {
																arr_label
																		.push(value[index].label);
																arr_obj
																		.push(value[index]);
															});
											$field.html(arr_label.join(', '));
											prjtrack_report_filters['opp_owner'] = arr_obj;
										}
										break;

									case 'opp_date':
									case 'opp_value':
										if (key == 'opp_date' && value != '') {
											if (value.search('BN') == -1) { // one
												// date
												var comparisioncode = value
														.substr(-2)
														.toUpperCase(); // last
												// two
												// characters
												var fullcomparisioncode = $(
														'#filters-prjtrack-comparison2 option[value="' + comparisioncode + '"]')
														.html();
												var comparisiondata = value
														.substr(
																0,
																value.length - 2);

												$('#filters-prjtrack-checkbox2')
														.prop('checked', true);
												$(
														'#filters-prjtrack-comparison2')
														.next()
														.html(
																fullcomparisioncode);
												changePrjTrackReportFilterValue(
														'filters-prjtrack-oppdate',
														comparisioncode);
												$('#filters-prjtrack-oppdate-1')
														.val(comparisiondata);

												prjtrack_report_filters['opp_date'] = comparisiondata
														+ comparisioncode;
											} else {
												var comparisioncode = "BN";
												var fullcomparisioncode = $(
														'#filters-prjtrack-comparison2 option[value="' + comparisioncode + '"]')
														.html();
												var comparisiondata1 = value
														.substr(0, value
																.search('B')); // first
												// date
												var comparisiondata2 = value
														.substr(
																value
																		.search('N') + 1,
																value.length - 2); // second
												// date
												$('#filters-prjtrack-checkbox2')
														.prop('checked', true);

												$(
														'#filters-prjtrack-comparison2')
														.next()
														.html(
																fullcomparisioncode);
												changePrjTrackReportFilterValue(
														'filters-prjtrack-oppdate',
														comparisioncode);

												$('#filters-prjtrack-oppdate-1')
														.val(comparisiondata1);
												$('#filters-prjtrack-oppdate-2')
														.val(comparisiondata2);

												prjtrack_report_filters['opp_date'] = comparisiondata1
														+ comparisioncode
														+ comparisiondata2;
											}
										} else if (key == 'opp_value'
												&& value != '') {
											if (value.search('BN') == -1) { // one
												// date
												var comparisioncode = value
														.substr(-2)
														.toUpperCase(); // last
												// two
												// characters
												var fullcomparisioncode = $(
														'#filters-prjtrack-comparison option[value="' + comparisioncode + '"]')
														.html();
												var comparisiondata = value
														.substr(
																0,
																value.length - 2);
												$('#filters-prjtrack-checkbox1')
														.prop('checked', true);

												$(
														'#filters-prjtrack-comparison')
														.next()
														.html(
																fullcomparisioncode);
												changePrjTrackReportFilterValue(
														'filters-prjtrack-oppvalue',
														comparisioncode);
												$(
														'#filters-prjtrack-oppvalue-1')
														.val(comparisiondata);

												prjtrack_report_filters['opp_value'] = comparisiondata
														+ comparisioncode;
											} else {
												var comparisioncode = "BN";
												var fullcomparisioncode = $(
														'#filters-prjtrack-comparison option[value="' + comparisioncode + '"]')
														.html();
												var comparisiondata1 = value
														.substr(0, value
																.search('B')); // first
												// date
												var comparisiondata2 = value
														.substr(
																value
																		.search('N') + 1,
																value.length - 2); // second
												// date
												$('#filters-prjtrack-checkbox1')
														.prop('checked', true);

												$(
														'#filters-prjtrack-comparison')
														.next()
														.html(
																fullcomparisioncode);
												changePrjTrackReportFilterValue(
														'filters-prjtrack-oppvalue',
														comparisioncode);

												$(
														'#filters-prjtrack-oppvalue-1')
														.val(comparisiondata1);
												$(
														'#filters-prjtrack-oppvalue-2')
														.val(comparisiondata2);

												prjtrack_report_filters['opp_value'] = comparisiondata1
														+ comparisioncode
														+ comparisiondata2;
											}
										}
										break;
									} /* switch */
								}); /* each */
			} /* if(filter_id!='') */
			else {
				resetPrjTrackReportFilters();
				setPrjTrackReportFilters(prjtrack_report_filters);
			}
		}
	}
})();

var createOverlayOptionSelection = ( function() {
	var $overlay;

	function toggleSideNav(toggle) {
		$('#side-nav').css('z-index', (toggle == true ? 1000 : 999));
	}

	function update_selection_count() {
		$('.badge', $overlay)
				.html(
						$('[data-role="overlay-selection-item"].selected',
								$overlay).length);
	}

	function get_selected_options() {
		var selected_items = [];
		$('[data-role="overlay-selection-item"].selected', $overlay).each(
				function() {
					if ($(this).attr('data-id')) {
						selected_items.push( [ $(this).attr('data-value'),
								$(this).attr('data-id') ]);
					} else {
						selected_items.push($(this).attr('data-value'));
					}
				});
		return selected_items;
	}

	function search_options(search_txt) {
		var search_txt = (search_txt || '').toLowerCase();
		$('[data-role="overlay-selection-item"]', $overlay).each(
				function() {
					var value = $(this).attr('data-value');
					$(this).toggleClass('hide',
							value.toLowerCase().indexOf(search_txt) < 0);
				});
	}

	// Added - Helen Schroeder - Added single and ids for contact training
	// session overlay
	return function(title, options, selected, apply_func, single, ids) {
		/*
		 * moved to getHTML above var html = '<div
		 * data-role="overlay-selection" class="overlay-selection">' + '<h2>' +
		 * title.toUpperCase() + '</h2>' + '<div
		 * class="list-search-container">' + '<ul class="list-search-buttons">' + '<li class="list-search"></li>' + '<li class="list-clear"></li>' + '</ul>' + '<div
		 * class="list-search-bar">' + '<input type="search"
		 * placeholder="Search" data-id="list-search">' + '<span class="badge"></span>' + '</div>' + '</div>' + '<div
		 * data-role="overlay-selection-item-container"
		 * class="overlay-selection-item-container">'; for (var i = 0; i <
		 * options.length; i++) { html += '<div data-value="' + options[i] + '"
		 * data-role="overlay-selection-item" ' html += ((i % 2) == 0 ?
		 * 'class="overlay-selection-item clear' :
		 * 'class="overlay-selection-item'); html += (jQuery.inArray(options[i],
		 * selected) >= 0 ? ' selected' : '') + '">' + options[i] + '</div>'; }
		 * html += '</div>' + '<button class="button"
		 * data-role="overlay-selection-save" type="button">Save</button>&nbsp;' + '<button
		 * class="button" type="button"
		 * data-role="overlay-selection-cancel">Cancel</button>'; + '</div>';
		 */
		var html = createOverlayOptionSelection.getHTML(title, options,
				selected, ids);

		// Added - 04/14/2016 - Helen Schroeder
		if (single) {
			showPopDialog(html, 1000, 400, 0);
		} else {
			showPopDialog(html, 600, 402, 0);
		}
		toggleSideNav(false);

		// Added - 02/24/2016 - Helen Schroeder - Added to prevent the table
		// behind the overlay from scrolling.
		$('div .content-area').css( {
			'overflow' : 'hidden'
		});
		$('div.grid-content div').css( {
			'overflow' : 'hidden'
		});
		// ////////////////////////////////////////

		$overlay = $('#popUpDef [data-role="overlay-selection"]');
		update_selection_count();

		$overlay.on('click', 'button[data-role="overlay-selection-save"]',
				function() {
					apply_func(get_selected_options());
					toggleSideNav(true);
					hidePop();

					// Added - 02/24/2016 - Helen Schroeder - Added to prevent
				// the table behind the overlay from scrolling.
				$('div .content-area').css( {
					'overflow' : ''
				});
				$('div.grid-content div.scroll-hide-y').css( {
					'overflow' : '',
					'overflow-y' : 'auto',
					'overflow-x' : 'hidden'
				});
				$('div.grid-content div:nth-child(2)').css( {
					'overflow' : '',
					'overflow-x' : 'auto'
				});
				// ////////////////////////////////////////

			}).on('click', 'button[data-role="overlay-selection-cancel"]',
				function() {
					toggleSideNav(true);
					hidePop();

					// Added - 02/24/2016 - Helen Schroeder - Added to prevent
				// the table behind the overlay from scrolling.
				$('div .content-area').css( {
					'overflow' : ''
				});
				$('div.grid-content div.scroll-hide-y').css( {
					'overflow' : '',
					'overflow-y' : 'auto',
					'overflow-x' : 'hidden'
				});
				$('div.grid-content div:nth-child(2)').css( {
					'overflow' : '',
					'overflow-x' : 'auto'
				});
				// ////////////////////////////////////////

			}).on('click', '[data-role="overlay-selection-item"]', function() {
			$(this).toggleClass('selected');
			update_selection_count();
		}).on(
				'keyup',
				'input[data-id="list-search"]',
				function(e) {
					if (e.keyCode == 13)
						search_options($('input[data-id="list-search"]',
								$overlay).val());
				}).on('click', 'li.list-search', function(e) {
			search_options($('input[data-id="list-search"]', $overlay).val());
		}).on('click', 'li.list-clear', function(e) {
			$('input[data-id="list-search"]', $overlay).val('');
			search_options('');
		});

	}
})();

// Added - Helen Schroeder - Added ids
createOverlayOptionSelection.getHTML = function(title, options, selected, ids) {
	// function to return html only
	var html = '<div data-role="overlay-selection" class="overlay-selection">'
			+ '<h2>'
			+ title.toUpperCase()
			+ '</h2>'
			+ '<div class="list-search-container">'
			+ '<ul class="list-search-buttons">'
			+ '<li class="list-search"></li>'
			+ '<li class="list-clear"></li>'
			+ '</ul>'
			+ '<div class="list-search-bar">'
			+ '<input type="search" placeholder="Search" data-id="list-search">'
			+ '<span class="badge"></span>'
			+ '</div>'
			+ '</div>'
			+ '<div data-role="overlay-selection-item-container" class="overlay-selection-item-container">';
	for ( var i = 0; i < options.length; i++) {
		if (ids) {
			html += '<div data-value="' + options[i]
					+ '" data-role="overlay-selection-item" data-id="' + ids[i]
					+ '"';
		} else {
			html += '<div data-value="' + options[i] + '" data-role="overlay-selection-item"';
		}
		html += ((i % 2) == 0 ? 'class="overlay-selection-item clear'
				: 'class="overlay-selection-item');
		html += (jQuery.inArray(options[i], selected) >= 0 ? ' selected' : '')
				+ '">' + options[i] + '</div>';
	}
	html += '</div>' + '<button class="button" data-role="overlay-selection-save" type="button">Save</button>&nbsp;' + '<button class="button" type="button" data-role="overlay-selection-cancel">Cancel</button>';
	+'</div>';
	return html;
}

var setReportFilters;
/* var setMgmtReportFilters; BCFTSGASDG-1606 - OBSOLETE */
var setPrjTrackReportFilters;
/* var
ListType; BCFTSGASDG-1606 - OBSOLETE */
var mgmtrep_getoppdata;
var mgmtrep_projecttracking_grid;
var mgmtrep_projectsummary_grid;
// BCFTSGASDG-1608 - Vishaal
var mgmtrep_activitysummary_grid;

// BCFTSGASDG-1430 -- Made these functions global for save filter option
var prjtrack_applySelectedFilter;
var prjtrack_constructFilterObject;
var resetPrjTrackReportFilters;
var prjtrack_applyFilters;

// BCFTSGASDG-1530
var sales_applySelectedFilter;
var sales_constructFilterObject;
var resetReportFilters;
var sales_applyFilters;

// BCFTSGASDG-1605 - Shawn - Added
// A function to check the user's roles and determine which
// report options should be shown on the sidenav
// This function is called on the postLoad of every report page
// so even when you are viewing as someone else, the sidenav
// will stay up to date
var updateReportSidenav = function() {
	var viewAs = viewAsOverlay.getViewAs();

	var accessRoles = viewAs.myself ? global.user.access.roles
			: viewAs.userRoles;

	// Mgmt report tabs are hidden by default
	// All other tabs, if agent permits, are shown

	var userIsBST = accessRoles.indexOf('BST') > -1;
	var userIsHeadOffice = accessRoles.indexOf('HEAD OFFICE') > -1;
	var userIsManagement = accessRoles.reduce( function(acc, cur) {
		return acc || (cur == 'BDM') || (cur == 'RAM');
	}, false);

	// hide all by default
	$('#side-nav-reports-menu li').hide();

	$('#side-nav-reports-menu li').each( function(index, tab) {
		var show = userIsHeadOffice; // Head office users sees all
			var $tab = $(tab);
			switch ($tab.attr('data-id')) {
			case 'mgmt-reports':
				show = show || (!userIsBST && userIsManagement);
				break;
			case 'bst-mgmt-reports':
				show = show || (userIsBST && userIsManagement);
				break;
			case 'bstreports':
				show = show || userIsBST;
				break;
			default:
				// All other CS reports
				show = show || (!userIsBST);
			}
			if (show) {
				$tab.show();
			}
		});
}

var initReport = ( function() {
	var report_filters = new List_Map_Data();
	/* BCFTSGASDG-1606 - OBSOLETE
	var mgmt_report_filters = new List_Map_Data(); // BCFTSGASDG-1297 Mgmt Report Filters are different
	*/
	var prjtrack_report_filters = new List_Map_Data(); // BCFTSGASDG-1415 Prj
	// Track Report Filters

	setReportFilters = function(filters) {
		report_filters.add('smonth', filters.smonth);
		report_filters.add('emonth', filters.emonth);
		// slices are required here for "deep copying" arrays
		report_filters.add('region', (filters.region || []).slice(0));
		report_filters.add('territory', (filters.territory || []).slice(0));
		report_filters.add('ph1', (filters.ph1 || []).slice(0));
		report_filters.add('ph2', (filters.ph2 || []).slice(0));
		report_filters.add('ph3', (filters.ph3 || []).slice(0));
		report_filters.add('ph4', (filters.ph4 || []).slice(0));
		report_filters.add('distributor', (filters.distributor || []).slice(0));
		report_filters.add('country', (filters.country || []).slice(0));
		report_filters.add('salesarea', (filters.salesarea || []).slice(0));
	}

	/* BCFTSGASDG-1606 - OBSOLETE
	setMgmtReportFilters = function(filters) {
		mgmt_report_filters.add('region', (filters.region || []).slice(0));
		mgmt_report_filters
				.add('territory', (filters.territory || []).slice(0));
		mgmt_report_filters.add('sector', (filters.sector || []).slice(0));
		mgmt_report_filters.add('productcategory',
				(filters.productcategory || []).slice(0));
		mgmt_report_filters.add('probability', (filters.probability || [])
				.slice(0));
		mgmt_report_filters.add('opp_value', filters.opp_value);
		mgmt_report_filters.add('opp_date', filters.opp_date);
		mgmt_report_filters
				.add('opp_owner', (filters.opp_owner || []).slice(0));
		mgmt_report_filters.add('country', (filters.country || []).slice(0));
		mgmt_report_filters
				.add('salesarea', (filters.salesarea || []).slice(0));
	}
	*/

	setPrjTrackReportFilters = function(filters) {
		prjtrack_report_filters.add('region', (filters.region || []).slice(0));
		prjtrack_report_filters.add('territory', (filters.territory || [])
				.slice(0));
		prjtrack_report_filters.add('sector', (filters.sector || []).slice(0));
		prjtrack_report_filters.add('productcategory',
				(filters.productcategory || []).slice(0));
		prjtrack_report_filters.add('probability', (filters.probability || [])
				.slice(0));
		prjtrack_report_filters.add('opp_value', filters.opp_value);
		prjtrack_report_filters.add('opp_date', filters.opp_date);
		prjtrack_report_filters.add('tracked_by', (filters.tracked_by || [])
				.slice(0));
		prjtrack_report_filters.add('opp_owner', (filters.opp_owner || [])
				.slice(0));
		prjtrack_report_filters.add('listType', '');
		prjtrack_report_filters
				.add('country', (filters.country || []).slice(0));
		prjtrack_report_filters.add('salesarea', (filters.salesarea || [])
				.slice(0));
	}

	/* BCFTSGSDG-1606 - OBSOLETE
	setMgmtReportFiltersListType = function(listType) {
		mgmt_report_filters.add('listType', listType);
	}
	*/

    // BCFTSGASDG-1605 - Shawn
    // The following function is called when the user clicks on the filters
    // apply button
    // in the BST sales report
    var bstSalesUpdateFilters = function() {
        var grid = this;
        grid.justClearFilters();
        // Use the grid API to clear all filters,
        // also clears all sorts

        // Iterate through every filterLayer with the data-id attribute
        $("#bst-sales-report-filters .filterLayer[data-id]").each(function() {
            var data_id = $(this).attr('data-id');
            if (!$('[data-id="' + data_id + '-checkbox"]', this).is(':checked')) {
                return;
            }

            switch (data_id) {
            case "regions":
            case "designProf":
            case "businessLine":
            case "productCat":
                var selected = $('[data-id="' + data_id + '-add"]', this).list_filter('get_values').map(function(item) {
                    return item[1];// 0 is the label, 1 is the code
                });
                if (selected.length > 0) {
                    grid.filters.add(data_id, selected);
                }
                break;
            case "closedDate":
            case "oppVal":
                var filterObj = {
                    comp: $('[data-id="' + data_id + '-comparison"]', this).val(),
                    val1: $('[data-id="' + data_id + '-1"]', this).val(),
                    val2: $('[data-id="' + data_id + '-2"]', this).val()
                };
                switch (filterObj.comp) {
                case "BN":
                    if (filterObj.val2.length <= 0 || (data_id == 'oppVal' && isNaN(filterObj.val2))) {
                        global.error.display('Error: Invalid field detected for the second value of filter "' + data_id + '". This filter was not applied');
                        return;
                    }
                default:
                    if (filterObj.val1.length <= 0 || (data_id == 'oppVal' && isNaN(filterObj.val1))) {
                        global.error.display('Error: Invalid field detected for the first value of filter "' + data_id + '". This filter was not applied');
                        return;
                    }
                }
                grid.filters.add(data_id, filterObj);
                break;
            default:
                global.error.display('Error: Unrecognized filter "' + data_id + '"');
            }
        });
    }

    // BCFTSGASDG-1605 - Shawn - Added
    // A function that, when called, will reset the BST sales report
    // filters pane visually.
    // Does NOT change the grid's filter object
    function bstSalesFiltersReset() {
        var $reportFilters = $('#bst-sales-report-filters .filterLayer[data-id]');

        $reportFilters.each(function(index, filter) {
            var data_id = $(this).attr('data-id');
            $('[data-id="' + data_id + '-checkbox"]', this).attr('checked', false);

            switch (data_id) {
            case "regions":
            case "designProf":
            case "businessLine":
            case "productCat":
                $('[data-id="' + data_id + '-add"]', this).list_filter('reset');
                break;
            case "closedDate":
            case "oppVal":
                $('[data-id="' + data_id + '-1"]', this).val('');
                $('[data-id="' + data_id + '-2"]', this).val('');
                break;
            default:
                global.error.display('Error: Unrecognized filter "' + data_id + '"');
            }
        });
    }

	function generateReportList(list_name) {
		if (typeof report_lists[list_name] === 'function')
			return report_lists[list_name].apply(this, Array.prototype.splice
					.call(arguments, 1));
	}

	function formatCellMoney(data) {

		var negativeSales = data < 0,
			abs = Math.abs(Number(data)) || 0,
			formatted = abs.toCurrency();

		this.addClass('list-number');
		this.toggleClass('negative-dollars', negativeSales);

		return negativeSales ? "(" + formatted + ")" : formatted;

	}

	function formatCellMoney_nodecimal(data) {

		var negativeSales = data < 0, abs = Math.round(Number(data)) || 0,
		// formatted = abs.toCurrency();
		formatted = abs.formatCurrency(0);

		this.addClass('list-number');
		this.toggleClass('negative-dollars', negativeSales);

		return negativeSales ? "(" + formatted + ")" : formatted;

	}

	function formatCellActivityProgress(data) {
		var boxClass
		if (Number(data) >= 1) {
			// this.addClass('cell-green');
			boxClass = 'cell-green'
		} else if (Number(data) < 1 && Number(data) >= .8) {
			// this.addClass('cell-yellow');
			boxClass = 'cell-yellow'

		} else {
			// this.addClass('cell-red');
			boxClass = 'cell-red'
		}

		// return Number(data)*100+"%";
		return '<div class="colorbox ' + boxClass + '"></div>'
	}

	// BCFTSGASDG-1502
	function formatCellPercentProgress(data) {
		this.css('color', '#FFF');
		if (Number(data) >= 1) {
			this.addClass('cell-green');
		} else if (Number(data) < 1 && Number(data) >= .95) {
			this.addClass('cell-yellow');
		} else {
			this.addClass('cell-red');
		}

		// return '<div class="colortd '+boxClass+'">'+ data +'%</div>'
	}

	function formatCellActivityProgressRG(data) {
		var boxClass
		if (Number(data) >= 1) {
			// this.addClass('cell-green');
			boxClass = 'cell-green'
		} else {
			// this.addClass('cell-red');
			boxClass = 'cell-red'
		}

		// return Number(data)*100+"%";
		return '<div class="colorbox ' + boxClass + '"></div>'

	}

	// BCFTSGASDG-1564
	function formatCellExpandContractor(data) {
		var boxClass;
		if (Number(data) >= 1) {
			boxClass = 'cell-red'
		} else {
			boxClass = 'cell-green';
		}
		return '<div class="colorbox ' + boxClass + '"></div>';
	}
	// BCFTSGASDG-1564
	function formatCellSkillTestingSeries(data) {
		var boxClass;
		if (Number(data) >= 80) {
			boxClass = 'cell-green';
		} else if (Number(data) >= 75) {
			boxClass = 'cell-yellow';
		} else {
			boxClass = 'cell-red';
		}
		return '<div class="colorbox ' + boxClass + '"></div>';
	}


    mgmtrep_getoppdata = function(options) {
        options = options || {};
        // var prefix = options.bst_report ? "bst":"";
        options.report_type = options.report_type || '';
        var prefix = options.report_type;

        var filters = options.filterManager ? options.filterManager.getFilters() : {};
        /* BCFTSGASDG-1606 - OBSOLETE
		// Set Filters
		mgmt_report_filters.add('reportType', options.report_type || '')
		mgmt_report_filters.add('listType',
				options.listType || 'oppvalbysector');
		mgmt_report_filters.add('view_as', viewAsOverlay.getListFilters());
		*/

        qstring = {
            start: 1,
            end: 20,
            //filters : JSON.stringify(mgmt_report_filters), BCFTSGASDG-1606 - OBSOLETE
            // TODO: BCFTSGASDG-1606
            filters: JSON.stringify($.extend(filters,{
            	view_as : viewAsOverlay.getListFilters(),
            	reportType : options.report_type || '',
            	listtype : options.listType || 'oppvalbysector'
            })),
            sorts: JSON.stringify({
                'count': 0
            }),
            fetchTotal: 'false'
        };

        $.ajax({
            url: global.database.Main + '/(getMgmtReportOpportunities)?OpenAgent',
            data: qstring,
            type: 'GET',
            success: function(response) {
                try {
                    var json = JSON.parse(response);
                    var ySeries = [];
                    var xSeries = [];
                    var dataSeries = [];
                    var noDataMsg = '<div style="position:relative; height:180px;"><div class="list-no-data greyText">THERE IS NO DATA THAT MATCHES YOUR SEARCH CRITERIA</div></div>';
                    switch (options.listType) {
                    case 'oppvalbyprodcat':
                        $.each(json.data, function(index, value) {
                            ySeries.push(json.data[index].Fcst_Product_Category);
                            // BCFTSGASDG-1463 -- Remove
                            // decimals
                            xSeries.push(Math.floor(Number(json.data[index].Opp_Value)));
                        });
                        if (xSeries.length == 0)
                            $("#" + prefix + "mr-oppvalue-chart").html(noDataMsg);
                        else
                            mgmtrep_loadBarChart("#" + prefix + "mr-oppvalue-chart", "", ySeries, 'Opportunity Value', xSeries);
                        break;
                    case 'oppvalbybusline':
                        $.each(json.data, function(index, value) {
                            ySeries.push(json.data[index].Fcst_Business_Line);
                            // BCFTSGASDG-1463 -- Remove
                            // decimals
                            xSeries.push(Math.floor(Number(json.data[index].Opp_Value)));
                        });
                        if (xSeries.length == 0)
                            $("#" + prefix + "mr-oppvalue-chart").html(noDataMsg);
                        else
                            mgmtrep_loadBarChart("#" + prefix + "mr-oppvalue-chart", "", ySeries, 'Opportunity Value', xSeries);
                        break;
                    case 'oppvalbysector':
                        $.each(json.data, function(index, value) {
                            ySeries.push(json.data[index].Fcst_Sector);
                            xSeries.push(Math.floor(Number(json.data[index].Opp_Value)));
                        });
                        if (xSeries.length == 0)
                            $("#" + prefix + "mr-oppvalue-chart").html(noDataMsg);
                        else
                            mgmtrep_loadBarChart("#" + prefix + "mr-oppvalue-chart", "", ySeries, 'Opportunity Value', xSeries);
                        break;
                    case 'oppvalbyprobability':
                        $.each(json.data, function(index, value) {
                            ySeries.push(json.data[index].Fcst_Probability);
                            xSeries.push(Math.floor(Number(json.data[index].Opp_Value)));
                        });
                        if (xSeries.length == 0)
                            $("#" + prefix + "mr-probability-chart").html(noDataMsg);
                        else
                            mgmtrep_loadBarChart("#" + prefix + "mr-probability-chart", "", ySeries, 'Opportunity Value', xSeries);
                        break;

                    case 'oppvalbywinlost': // For CS
                        var chartTotal = 0;
                        $.each(json.data[0], function(key, value) {
                            var series = {}
                            series['name'] = key;
                            series['data'] = [];
                            series.data.push(Math.floor(Number(value)));
                            dataSeries.push(series);
                            chartTotal = chartTotal + Number(value);
                        });
                        if (chartTotal == 0)
                            $("#mr-winloss-chart").html(noDataMsg);
                        else
                            mgmtrep_loadStackedBarChart("#mr-winloss-chart", "", "Total Opportunities", dataSeries);
                        break;
                    case 'oppvalbywinlost-multiyear': // For BST
                    	var $chartsContainer = $('#bst-mr-opp-panel-winloss')
                    	$.each(json.data, function(index, yearObj) {
                    		// Make the container
                    		dataSeries = [];
                        	var html = '<h3 class="winloss-chart-header">'+yearObj.Year+'</h3>'
                        			 + '<div class="panel-content" id="bst-mr-winloss-chart-'+yearObj.Year+'"></div>';
                        	$chartsContainer.append(html);
                        	// Make the chart
                        	var chartTotal = 0;
                    		$.each(yearObj, function(key, value){
                    			if( key != 'Year' ) {
                        			var series = {};
                        			series.name = key;
                        			series.data = [Math.floor(Number(value))];
                        			dataSeries.push(series);
                        			chartTotal = chartTotal + Number(value);
                    			}
                    		});
                    		if( chartTotal == 0 )
                    			$('#bst-mr-winloss-chart-'+yearObj.Year).html(noDataMsg)
                    		else
                    			mgmtrep_loadStackedBarChart('#bst-mr-winloss-chart-'+yearObj.Year, "", "Total Opportunities", dataSeries);
                    	});
                    	break;
                    }
                } catch (e) {
                    global.error.display(global.error.GENERIC);
                }
            },
            error: function() {
                global.error.display(global.error.GENERIC);
            }
        });
    }

    function mgmtrep_loadBarChart(container, title, barlabels, seriesname, series) {

        $(container).highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: title
            },
            tooltip: {
                valuePrefix: '$'
            },
            xAxis: {
                categories: barlabels,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: null
                },
                labels: {
                    formatter: function() {
                        return this.value / 1000000 + "M"
                    }
                }
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            colors: ['#FF9900'],
            legend: {
                enabled: false
            },
            series: [{
                colorByPoint: true,
                name: seriesname,
                data: series
            }]
        });

        setTimeout(function() {
            $(container).highcharts().reflow()
        }, 100);
        // $(container).highcharts().reflow();

    }

	function mgmtrep_loadStackedBarChart(container, title, ytitle, dataseries) {

		$(container).highcharts( {
			chart : {
				type : 'bar',
				height : 250
			},
			title : {
				text : title
			},
			tooltip : {
				valuePrefix : '$'
			},
			xAxis : {
				categories : [ 'Opportunity Value' ]
			},
			yAxis : {
				min : 0,
				title : {
					text : ytitle
				},
				labels : {
					formatter : function() {
						return this.value / 1000000 + "M"
					}
				}
			},
			plotOptions : {
				series : {
					stacking : 'normal',
					pointWidth : 40
				}
			},
			colors : [ '#666', '#333', '#FF9900' ],
			legend : {
				reversed : true
			},
			series : dataseries
		});

		setTimeout( function() {
			$(container).highcharts().reflow()
		}, 100);

	}

	function getProjectTrackingReportColumns_noGI() {
		var columnModel = [
				{
					name : "projectName",
					label : "Project Name",
					alias : "Project Name",
					style : {
						"min-width" : "200px",
						"max-width" : "250px"
					},
					sortable : true,
					bodyClass : "toolTip"
				},
				{
					name : "region",
					label : "Country",
					alias : "Country",
					style : {
						"min-width" : "120px"
					}
				},
				{
					name : "stateProvince",
					label : "State/ Province",
					alias : "State/ Province",
					style : {
						"min-width" : "135px"
					}
				},
				{
					name : "productCategory",
					label : "Product Category",
					alias : "Product Category",
					style : {
						"min-width" : "180px"
					},
					bodyClass : "toolTip"
				},
				{
					name : "tsm",
					label : "Opp. Owner",
					alias : "Opp. Owner",
					style : {
						"min-width" : "150px"
					},
					sortable : true
				},
				{
					// BCFTSGASDG-1441 - Added Tracked By column
					name : "trackedBy",
					label : "Tracked By",
					alias : "Tracked By",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				},
				{
					name : "sector",
					label : "Sector",
					alias : "Sector",
					style : {
						"min-width" : "180px"
					},
					bodyClass : "toolTip"
				},
				{
					name : "mainIndustry",
					label : "Main Industry",
					alias : "Main Industry"
				},
				{
					name : "subIndustry",
					label : "Sub Industry",
					alias : "Sub Industry"
				},
				{
					name : "initContactDate",
					label : "Initial Contact Date",
					alias : "Initial Contact Date",
					style : {
						"min-width" : "100px"
					}
				},
				{
					name : "recentUpdate",
					label : "Recent Update",
					alias : "Recent Update",
					style : {
						"min-width" : "100px"
					},
					sortable : true
				},
				{
					name : "product",
					label : "Product",
					alias : "Product",
					style : {
						"min-width" : "200px",
						"max-width" : "250px"
					},
					// bodyClass: "toolTip",
					renderCell : function(data, i, depth) {
						if (data.product) {
							return '<div class="toolTip" style="width:100%">' + data.product + '</div>';
						}
					}
				},
				{
					name : "squareFootage",
					label : "Square Footage",
					alias : "Square Footage",
					// bodyClass:"list-number",
					renderCell : function(data, i, depth) {
						this.addClass('list-number');
						return Number(data.squareFootage)
								.toCurrencyWithOptions(0, '', ',');
					}

				},
				{
					name : "opportunityValue",
					label : "Opportunity Value",
					alias : "Opportunity Value",
					// bodyClass:"list-number"
					renderCell : function(data, i, depth) {
						return Number(data.opportunityValue)
								.toCurrencyWithOptions(0, '$', ',');
					}

				}, {
					name : "probability",
					label : "Probability",
					alias : "Probability",
					style : {
						"min-width" : "150px",
						"max-width" : "180px"
					},
					bodyClass : "toolTip"
				}, {
					name : "opportunityMonth",
					label : "Estimated Close Month",
					alias : "Estimated Close Month",
					style : {
						"min-width" : "100px"
					}
				}, {
					name : "opportunityYear",
					label : "Estimated Close Year",
					alias : "Estimated Close Year",
					style : {
						"min-width" : "100px"
					}
				}, {
					name : "ownerFacilityName",
					label : "Owner Facility",
					alias : "Owner Facility",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "manufacturer",
					label : "Manufacturer",
					alias : "Manufacturer",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "contractor",
					label : "contractor",
					alias : "Contractor",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "dp",
					label : "Design Professional",
					alias : "Design Professional",
					bodyClass : "toolTip",
					style : {
					// "min-width" : "150px",
					// "max-width" : "250px"
					}
				// ,
				// renderCell: function(data, i, depth) {
				// if(data.dp) {
				// return '<div class="toolTip" style="width:100%">' + data.dp +
				// '</div>';
				// }
				// }

				}
		/*
		 * ,{ name: "projectStatusNotes", label: "Project Status Notes", alias:
		 * "Project Status Notes", style: { "min-width" : "150px", "max-width" :
		 * "250px" }, renderCell: function(data, i, depth) {
		 * if(data.projectStatusNotes) { return '<div class="toolTip"
		 * style="width:100%">' + data.projectStatusNotes + '</div>'; } }, //
		 * Le Trong - JIRA# BCFTSGASDG-1222 excelHidden: true }
		 */
		]

		return columnModel;
	}

	function getProjectTrackingReportColumns(repColLabel) {
		var columnModel = [
				{
					name : "projectName",
					label : "Project Name",
					alias : "Project Name",
					style : {
						"min-width" : "200px",
						"max-width" : "250px"
					},
					sortable : true,
					bodyClass : "toolTip"
				},
				{
					name : "region",
					label : "Region",
					alias : "Region",
					style : {
						"min-width" : "120px"
					}
				},
				{
					name : "stateProvince",
					label : "State/ Province",
					alias : "State/ Province",
					style : {
						"min-width" : "135px"
					}
				},
				{
					name : "productCategory",
					label : "Product Category",
					alias : "Product Category",
					style : {
						"min-width" : "180px"
					},
					bodyClass : "toolTip"
				},
				{
					name : "name",
					label : repColLabel || "Rep Name",
					alias : repColLabel || "Rep Name",
					style : {
						"min-width" : "150px"
					},
					sortable : true
				},
				{
					name : "sector",
					label : "Sector",
					alias : "Sector",
					style : {
						"min-width" : "180px"
					},
					bodyClass : "toolTip"
				},
				{
					name : "mainIndustry",
					label : "Main Industry",
					alias : "Main Industry"
				},
				{
					name : "subIndustry",
					label : "Sub Industry",
					alias : "Sub Industry"
				},
				{
					name : "initContactDate",
					label : "Initial Contact Date",
					alias : "Initial Contact Date",
					style : {
						"min-width" : "100px"
					}
				},
				{
					name : "recentUpdate",
					label : "Recent Update",
					alias : "Recent Update",
					style : {
						"min-width" : "100px"
					},
					sortable : true
				},
				{
					name : "product",
					label : "Product",
					alias : "Product",
					style : {
						"min-width" : "200px",
						"max-width" : "250px"
					},
					// bodyClass: "toolTip",
					renderCell : function(data, i, depth) {
						if (data.product) {
							return '<div class="toolTip" style="width:100%">' + data.product + '</div>';
						}
					}
				},
				{
					name : "squareFootage",
					label : "Square Footage",
					alias : "Square Footage",
					// bodyClass:"list-number",
					renderCell : function(data, i, depth) {
						this.addClass('list-number');
						return Number(data.squareFootage)
								.toCurrencyWithOptions(0, '', ',');
					}

				},
				{
					name : "opportunityValue",
					label : "Opportunity Value",
					alias : "Opportunity Value",
					// bodyClass:"list-number"
					renderCell : function(data, i, depth) {
						return Number(data.opportunityValue)
								.toCurrencyWithOptions(0, '$', ',');
					}

				}, {
					name : "probability",
					label : "Probability",
					alias : "Probability",
					style : {
						"min-width" : "150px",
						"max-width" : "180px"
					},
					bodyClass : "toolTip"
				}, {
					name : "opportunityDate",
					label : "Estimated Close Date",
					alias : "Estimated Close Date",
					style : {
						"min-width" : "100px"
					}
				}, {
					name : "ownerFacilityName",
					label : "Owner Facility",
					alias : "Owner Facility",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "manufacturer",
					label : "Manufacturer",
					alias : "Manufacturer",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "contractor",
					label : "contractor",
					alias : "Contractor",
					bodyClass : "toolTip",
					style : {
						"min-width" : "150px",
						"max-width" : "250px"
					}
				}, {
					name : "dp",
					label : "Design Professional",
					alias : "Design Professional",
					bodyClass : "toolTip",
					style : {
					// "min-width" : "150px",
					// "max-width" : "250px"
					}
				// ,
				// renderCell: function(data, i, depth) {
				// if(data.dp) {
				// return '<div class="toolTip" style="width:100%">' + data.dp +
				// '</div>';
				// }
				// }

				}
		/*
		 * ,{ name: "projectStatusNotes", label: "Project Status Notes", alias:
		 * "Project Status Notes", style: { "min-width" : "150px", "max-width" :
		 * "250px" }, renderCell: function(data, i, depth) {
		 * if(data.projectStatusNotes) { return '<div class="toolTip"
		 * style="width:100%">' + data.projectStatusNotes + '</div>'; } }, //
		 * Le Trong - JIRA# BCFTSGASDG-1222 excelHidden: true }
		 */
		]

		return columnModel;
	}

	var report_lists = {
		bst_sales : function(options) {
			var ret_list = new Grid(
					{
						container : $("#bst_sales_report")[0],
						dataSource : global.database.Main + '/BST_getSalesReport?OpenAgent',
						fetch : {
							schedule : "all",
							rows : 10
						},
						height : 500,
						paging : "scroll",
						defaultFilters : function() {
							this.filters.add('view_as', viewAsOverlay
									.getListFilters());
						},
						tableClass : "list-template-main list-template1",
						selection : false,
						hasFooter : true,
						categorized : true,
						columnModel : [
								{
									name : "rowTitle",
									label : "Design Professional/Business Line/Product Category",
									alias : "Design Professional/Business Line/Product Category",
									sortable : true,
									frozen : true,
									style : {}
								},
								{
									name : "prospect",
									label : "Prospect ($)",
									alias : "Prospect ($)",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney.call(this,
												data["prospect"]);
									},
									renderFooter : function(data, i) {
										return formatCellMoney.call(this,
												data["totalProspect"]);
									}
								},
								{
									name : "specified",
									label : "Specified ($)",
									alias : "Specified ($)",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney.call(this,
												data["specified"]);
									},
									renderFooter : function(data, i) {
										return formatCellMoney.call(this,
												data["totalSpecified"]);
									}
								},
								{
									name : "won",
									label : "Won ($)",
									alias : "Won ($)",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney.call(this,
												data["won"]);
									},
									renderFooter : function(data, i) {
										return formatCellMoney.call(this,
												data["totalWon"]);
									}
								} ],
						list_name : 'BST_Sales_Report', // What is this for?
						updateFilters : function() {
							bstSalesUpdateFilters.call(this);
							this.getNewData();
						},
						clearfilters : function() {
							Grid.prototype.clearfilters.call(this); // Use
																	// Grid.prototype
						bstSalesFiltersReset();
					}
					});
			return ret_list;
		},
        year_summary: function(options) {
            var ret_list = new Grid({
                container: $("#reportsYearList")[0],
                dataSource: global.database.Main + '/getReportDataYearSummary?OpenAgent',
                fetch: {
                    schedule: "progressive",
                    rows: 9
                },
                height: 450,
                paging: "scroll",
                defaultFilters: function() {
                    this.filters = report_filters;
                    this.filters.add('view_as', viewAsOverlay.getListFilters());
                },
                tableClass: "list-template-main list-template1",
                hasFooter: true,
                columnModel: [{
                    name: "company",
                    label: "Sold To",
                    alias: "Sold To",
                    sortable: true,
                    frozen: true,
                    style: {
                        "min-width": "100px"
                    },
                    renderCell: function(data, i, depth) {},
                    renderHeader: function(data, i) {},
                    renderFooter: function(data, i) {}
                }, {
                    name: "sales" + global.reports.season,
                    label: global.reports.season,
                    alias: global.reports.season + ' Sales',
                    sortable: true,
                    renderCell: function(data, i, depth) {
                        return formatCellMoney.call(this, data["sales" + global.reports.season]);
                    },
                    renderFooter: function(data, i) {
                        return formatCellMoney.call(this, data["sales" + global.reports.season]);
                    }
                }, {
                    name: "sales" + (parseInt(global.reports.season) - 1).toString(),
                    label: (parseInt(global.reports.season) - 1).toString(),
                    alias: (parseInt(global.reports.season) - 1).toString() + ' Sales',
                    sortable: true,
                    renderCell: function(data, i, depth) {
                        return formatCellMoney.call(this, data["sales" + (parseInt(global.reports.season) - 1).toString()]);
                    },
                    renderFooter: function(data, i) {
                        return formatCellMoney.call(this, data["sales" + (parseInt(global.reports.season) - 1).toString()]);
                    }
                }, {
                    name: "salesdiff",
                    label: global.reports.season + " vs. " + (parseInt(global.reports.season) - 1).toString(),
                    alias: global.reports.season + " vs. " + (parseInt(global.reports.season) - 1).toString(),
                    sortable: true,
                    renderCell: function(data, i, depth) {
                        return formatCellMoney.call(this, data.salesdiff);
                    },
                    renderFooter: function(data, i) {
                        return formatCellMoney.call(this, data["sales" + global.reports.season] - data["sales" + (parseInt(global.reports.season) - 1).toString()]);
                    }
                }, {
                    name: "change",
                    label: "% Change",
                    alias: "% Change",
                    sortable: true,
                    renderCell: function(data, i, depth) {

                        var change = Number(data.change);

                        this.addClass('list-number');
                        this.toggleClass('negative-dollars', change < 0);

                        return !isNaN(change) && isFinite(change) && change !== 100 ? change.toFixed(1) + "%" : "N/A";

                    },
                    renderFooter: function(data, i) {

                        var totalDifference = data["sales" + global.reports.season] - data["sales" + (parseInt(global.reports.season) - 1).toString()]
                          , change = ((totalDifference / (data["sales" + (parseInt(global.reports.season) - 1).toString()] || data["sales" + global.reports.season])) || 0) * 100
                          , negativeDifference = totalDifference < 0;

                        this.addClass('list-number');
                        this.toggleClass('negative-dollars', negativeDifference);

                        return !isNaN(change) && isFinite(change) && change !== 100 ? change.toFixed(1) + "%" : "N/A";

                    }
                }],
                noDataToggle: function() {// TODO
                },
                listName: 'Sales_Report',
                postLoad: function() {
                    savedFilters_GetFilterNames('Sales_Report');
                },
                constructFilter: function() {
                    sales_constructFilterObject();
                },
                applyFilters: function() {
                    sales_applyFilters();
                },
                applySavedFilter: function() {
                    sales_applySelectedFilter();
                },
                resetFilters: function(reloadlist) {
                    resetReportFilters(reloadlist);
                }
            });
            return ret_list;
        },

		year_details : function() {

			var ret_list = new Grid(
					{
						container : $('#reportsYearDetails')[0],
						fetch : {
							schedule : "all",
							rows : 10
						},
						height : 500,
						paging : "scroll",
						dataSource : global.database.Main + '/getReportDataYearDetails?OpenAgent',
						defaultFilters : function() {
							this.filters = report_filters;
						},
						tableClass : "list-template-main list-template1",
						selection : false,
						hasFooter : true,
						categorized : true,
						columnModel : [
								{
									name : "company",
									label : "Sold To",
									alias : "Sold To",
									sortable : true,
									frozen : true,
									style : {
										"min-width" : "100px"
									},
									renderCell : function(data, i, depth) {

										if (depth === 1) {
											return data.hierarchy2 + " - "
													+ data.hierarchy2Desc || ""
										} else if (depth === 2) {
											return data.hierarchy1Desc || ""
										}

									},
									renderHeader : function(data, i) {

									},
									renderFooter : function(data, i) {
										return "";
									}
								},
								{
									name : "sales" + global.reports.season,
									label : "Sales " + global.reports.season,
									alias : "Sales " + global.reports.season,
									sortable : true,
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["sales"
												+ global.reports.season]) < 0) {
											this.addClass('negative-dollars');
											return '(' + Math
													.abs(
															Number(data["sales"
																	+ global.reports.season]))
													.toCurrency() + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return Number(
													data["sales"
															+ global.reports.season])
													.toCurrency();
										}
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return Number(
												data["sales"
														+ global.reports.season])
												.toCurrency();
									}
								},
								{
									name : "sales"
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									label : "Sales "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									alias : "Sales "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									sortable : true,
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["sales"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) < 0) {
											this.addClass('negative-dollars');
											return '(' + Math
													.abs(
															Number(data["sales"
																	+ (parseInt(global.reports.season) - 1)
																			.toString()]))
													.toCurrency() + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return Number(
													data["sales"
															+ (parseInt(global.reports.season) - 1)
																	.toString()])
													.toCurrency();
										}
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return Number(
												data["sales"
														+ (parseInt(global.reports.season) - 1)
																.toString()])
												.toCurrency();
									}
								},
								{
									name : "quantity" + global.reports.season,
									label : "Quantity " + global.reports.season,
									alias : "Quantity " + global.reports.season,
									sortable : true,
									style : {
										"min-width" : "130px"
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										return ut_numberWithCommas(Number(data["quantity"
												+ global.reports.season]));
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return ut_numberWithCommas(Number(data["quantity"
												+ global.reports.season]));
									}
								},
								{
									name : "quantity"
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									label : "Quantity "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									alias : "Quantity "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									sortable : true,
									style : {
										"min-width" : "130px"
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										return ut_numberWithCommas(Number(data["quantity"
												+ (parseInt(global.reports.season) - 1)
														.toString()]));
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return ut_numberWithCommas(Number(data["quantity"
												+ (parseInt(global.reports.season) - 1)
														.toString()]));
									}
								},

								// Le Trong - JIRA# BCFTSGASDG-1054
								/*-------------------------------------------------------------------------------------------------------------
								{
									name: "margin"+global.reports.season,
									label: "Margin "+global.reports.season+" $",
									alias: "Margin "+global.reports.season+" $",
									sortable: true,
									style: {
										"min-width": "130px"
									},
									renderCell: function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["margin"+global.reports.season])<0) {
											this.addClass('negative-dollars');
											return '('+Math.abs(Number(data["margin"+global.reports.season])).toCurrency()+')';
										} else {
											this.removeClass('negative-dollars');
											return Number(data["margin"+global.reports.season]).toCurrency();
										}
									},
									renderFooter: function(data, i){
										this.addClass('list-number');
										return Number(data["margin"+global.reports.season]).toCurrency();
									}
								}, {
									name: "margin"+(parseInt(global.reports.season)-1).toString(),
									label: "Margin "+(parseInt(global.reports.season)-1).toString()+" $",
									alias: "Margin "+(parseInt(global.reports.season)-1).toString()+" $",
									sortable: true,
									style: {
										"min-width": "130px"
									},
									renderCell: function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["margin"+(parseInt(global.reports.season)-1).toString()])<0) {
											this.addClass('negative-dollars');
											return '('+Math.abs(Number(data["margin"+(parseInt(global.reports.season)-1).toString()])).toCurrency()+')';
										} else {
											this.removeClass('negative-dollars');
											return Number(data["margin"+(parseInt(global.reports.season)-1).toString()]).toCurrency();
										}
									},
									renderFooter: function(data, i){
										this.addClass('list-number');
										return Number(data["margin"+(parseInt(global.reports.season)-1).toString()]).toCurrency();
									}
								},{
									name: "margin"+global.reports.season+"per",
									label: "Margin "+global.reports.season+" %",
									alias: "Margin "+global.reports.season+" %",
									sortable: true,
									style: {
										"min-width": "130px"
									},
									renderCell: function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["sales"+global.reports.season])== 0){
											return 'N/A';
										} else {
											var per = (Number(data["margin"+global.reports.season]) / Number(data["sales"+global.reports.season])) * 100;
											return per.toFixed(1)+'%';
										}
									},
									renderFooter: function(data, i){
										this.addClass('list-number');
										if (Number(data["sales"+global.reports.season])== 0){
											return 'N/A';
										} else {
											var per = (Number(data["margin"+global.reports.season]) / Number(data["sales"+global.reports.season])) * 100;
											return per.toFixed(1)+'%';
										}
									}
								},
								-------------------------------------------------------------------------------------------------------------*/
								{
									name : "salevar"
											+ global.reports.season.slice(-2)
											+ "vs"
											+ (parseInt(global.reports.season) - 1)
													.toString().slice(-2),
									label : "Sales Variance '"
											+ global.reports.season.slice(-2)
											+ " vs '"
											+ (parseInt(global.reports.season) - 1)
													.toString().slice(-2),
									alias : "Sales Variance "
											+ global.reports.season
											+ " vs "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									sortable : true,
									style : {
										"min-width" : "140px"
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["salevar"
												+ global.reports.season
														.slice(-2)
												+ "vs"
												+ (parseInt(global.reports.season) - 1)
														.toString().slice(-2)]) < 0) {
											this.addClass('negative-dollars');
											return '(' + Math
													.abs(
															Number(data["salevar"
																	+ global.reports.season
																			.slice(-2)
																	+ "vs"
																	+ (parseInt(global.reports.season) - 1)
																			.toString()
																			.slice(
																					-2)]))
													.toCurrency() + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return Number(
													data["salevar"
															+ global.reports.season
																	.slice(-2)
															+ "vs"
															+ (parseInt(global.reports.season) - 1)
																	.toString()
																	.slice(-2)])
													.toCurrency();
										}
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										var diff = Number(data["sales"
												+ global.reports.season])
												- Number(data["sales"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										if (diff < 0) {
											this.addClass('negative-dollars');
											return '(' + Math.abs(diff)
													.toCurrency() + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return diff.toCurrency();
										}
									}
								},
								{
									name : "salevarper",
									label : "Sales Variance % Change",
									alias : "Sales Variance % Change",
									sortable : true,
									style : {
										"min-width" : "140px"
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["sales"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) === 0) {
											this
													.removeClass('negative-dollars');
											return 'N/A';
										}
										var diff = Number(data["sales"
												+ global.reports.season])
												- Number(data["sales"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										var perChange = (diff / (Number(data["sales"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) || Number(data["sales"
												+ global.reports.season]))) || 0;
										perChange = (perChange * 100);
										if (perChange < 0) {
											this.addClass('negative-dollars');
										} else {
											this
													.removeClass('negative-dollars');
										}
										perChange = perChange.toFixed(1) + '%';
										return perChange;
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										var diff = Number(data["sales"
												+ global.reports.season])
												- Number(data["sales"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										var perChange = (diff / (Number(data["sales"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) || Number(data["sales"
												+ global.reports.season]))) || 0;
										perChange = (perChange * 100);
										if (perChange < 0) {
											this.addClass('negative-dollars');
										} else {
											this
													.removeClass('negative-dollars');
										}
										perChange = perChange.toFixed(1) + '%';
										return perChange;
									}
								},
								{
									name : "quavar"
											+ global.reports.season.slice(-2)
											+ "vs"
											+ (parseInt(global.reports.season) - 1)
													.toString().slice(-2),
									label : "Quantity&nbsp;Variance<br>'"
											+ global.reports.season.slice(-2)
											+ " vs '"
											+ (parseInt(global.reports.season) - 1)
													.toString().slice(-2),
									alias : "Quantity Variance "
											+ global.reports.season
											+ " vs "
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									sortable : true,
									style : {
										"min-width" : "156px"
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["quavar"
												+ global.reports.season
														.slice(-2)
												+ "vs"
												+ (parseInt(global.reports.season) - 1)
														.toString().slice(-2)]) < 0) {
											this.addClass('negative-dollars');
											return '(' + Math
													.abs(Number(data["quavar"
															+ global.reports.season
																	.slice(-2)
															+ "vs"
															+ (parseInt(global.reports.season) - 1)
																	.toString()
																	.slice(-2)])) + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return Number(data["quavar"
													+ global.reports.season
															.slice(-2)
													+ "vs"
													+ (parseInt(global.reports.season) - 1)
															.toString().slice(
																	-2)]);
										}
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										var diff = Number(data["quantity"
												+ global.reports.season])
												- Number(data["quantity"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										diff = diff.toFixed(2);
										if (diff < 0) {
											this.addClass('negative-dollars');
											return '(' + ut_numberWithCommas(Math
													.abs(diff)) + ')';
										} else {
											this
													.removeClass('negative-dollars');
											return ut_numberWithCommas(diff);
										}
									}
								},
								{
									name : "quavarper",
									label : "Quantity&nbsp;Variance<br>% Change",
									alias : "Quantity Variance % Change",
									sortable : true,
									style : {
										"min-width" : '156px'
									},
									renderCell : function(data, i, depth) {
										this.addClass('list-number');
										if (Number(data["quantity"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) === 0) {
											this
													.removeClass('negative-dollars');
											return 'N/A';
										}
										var diff = Number(data["quantity"
												+ global.reports.season])
												- Number(data["quantity"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										var perChange = (diff / (Number(data["quantity"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) || Number(data["quantity"
												+ global.reports.season]))) || 0;
										perChange = (perChange * 100);
										if (perChange < 0) {
											this.addClass('negative-dollars');
										} else {
											this
													.removeClass('negative-dollars');
										}
										perChange = perChange.toFixed(1) + '%';

										if (!(global.isIpad)) {
											this.css('padding-right', '27px');
										}

										return perChange;
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										var diff = Number(data["quantity"
												+ global.reports.season])
												- Number(data["quantity"
														+ (parseInt(global.reports.season) - 1)
																.toString()]);
										var perChange = (diff / (Number(data["quantity"
												+ (parseInt(global.reports.season) - 1)
														.toString()]) || Number(data["quantity"
												+ global.reports.season]))) || 0;
										perChange = (perChange * 100);
										if (perChange < 0) {
											this.addClass('negative-dollars');
										} else {
											this
													.removeClass('negative-dollars');
										}
										perChange = perChange.toFixed(1) + '%';

										if (!(global.isIpad)) {
											this.css('padding-right', '27px');
										}

										return perChange;
									}

								} ],

						styleRow : function(data, i, depth) {

						},

						postLoad : function() {
						},

						noDataToggle : function() {

							// TODO

					},
					listName : 'Sales_Report',
					postLoad : function() {
						savedFilters_GetFilterNames('Sales_Report');
					},
					constructFilter : function() {
						sales_constructFilterObject();
					},
					applyFilters : function() {
						sales_applyFilters();
					},
					applySavedFilter : function() {
						sales_applySelectedFilter();
					},
					resetFilters : function(reloadlist) {
						resetReportFilters(reloadlist);
					}

					});

			return ret_list;

		},

		average_price : function() {
			var ret_list = new Grid(
					{
						container : $("#reportsAveragePrice")[0],
						fetch : {
							schedule : "progressive",
							rows : 9
						},
						height : 450,
						paging : "scroll",
						dataSource : global.database.Main + '/getReportDataAverageSellingPrice?OpenAgent',
						tableClass : "list-template-main list-template1",
						defaultSorts : function() {
						},
						clearActions : function() {
							$('#reportsAveragePrice [data-id="list-search"]')
									.val('');
							this.defaultFilters();
						},
						prefilteropen : function() {
						},
						defaultFilters : function() {
							this.filters = report_filters;
						},
						columnModel : [
								{
									name : "company",
									label : "Sold to",
									alias : "Sold To",
									frozen : true,
									sortable : true,
									style : {
										"min-width" : "100px"
									},
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "sales" + global.reports.season,
									label : global.reports.season
											+ " Gross Sales",
									alias : global.reports.season
											+ " Gross Sales",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney
												.call(
														this,
														data["sales"
																+ global.reports.season]);
									}
								},
								{
									name : "avg" + global.reports.season,
									label : global.reports.season
											+ " Avg Sell Price",
									alias : global.reports.season
											+ " Avg Sell Price",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney
												.call(
														this,
														data["avg"
																+ global.reports.season]);
									}
								},
								{
									name : "sales"
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									label : (parseInt(global.reports.season) - 1)
											.toString()
											+ " Gross Sales",
									alias : (parseInt(global.reports.season) - 1)
											.toString()
											+ " Gross Sales",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney
												.call(
														this,
														data["sales"
																+ (parseInt(global.reports.season) - 1)
																		.toString()]);
									}
								},
								{
									name : "avg"
											+ (parseInt(global.reports.season) - 1)
													.toString(),
									label : (parseInt(global.reports.season) - 1)
											.toString()
											+ " Avg Sell Price",
									alias : (parseInt(global.reports.season) - 1)
											.toString()
											+ " Avg Sell Price",
									sortable : true,
									renderCell : function(data, i, depth) {
										return formatCellMoney
												.call(
														this,
														data["avg"
																+ (parseInt(global.reports.season) - 1)
																		.toString()]);
									}
								},
								{
									name : "change",
									label : "% Change in ASP",
									alias : "% Change in ASP",
									sortable : true,
									renderCell : function(data, i, depth) {

										var change = Number(data.change);

										this.addClass('list-number');
										this.toggleClass('negative-dollars',
												change < 0);

										return !isNaN(change)
												&& isFinite(change)
												&& change !== 100 ? change
												.toFixed(1)
												+ "%" : "N/A";

									}
								} ],

						noDataToggle : function() {
							// TODO
					},
					listName : 'Sales_Report',
					postLoad : function() {
						savedFilters_GetFilterNames('Sales_Report');
					},
					constructFilter : function() {
						sales_constructFilterObject();
					},
					applyFilters : function() {
						sales_applyFilters();
					},
					applySavedFilter : function() {
						sales_applySelectedFilter();
					},
					resetFilters : function(reloadlist) {
						resetReportFilters(reloadlist);
					}
					});

			return ret_list;

		},

		// GI REPORTS
		expand_contractor_network : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 310) / 50);
				return (count > 0 ? count : 9);
			}
			var ret_list = new Grid(
					{
						container : $("." + global.currentpage.subclass
								+ " #report_expand_contractor_network")[0],
						dataSource : global.database.Main
								+ '/getReportExpandContractorNetwork?OpenAgent'
								+ '&repyear=' + options.repyear + '&repmonth='
								+ options.repmonth,
						fetch : {
							schedule : "progressive",
							rows : rowcount()
						},
						height : rowcount() * 50,
						paging : "scroll",
						defaultFilters : function() {
							// this.filters = report_filters;
						// this.filters.add('view_as',viewAsOverlay.getListFilters());
					},
						// hasFooter: true,
						tableClass : "list-template-main list-template1",
						columnModel : [
								{
									name : "Sales_Manager",
									label : "Teritory Sales Manager",
									alias : "Sales Manager",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "Region",
									label : "Region",
									alias : "Region",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "SAP_Number",
									label : "SAP #",
									alias : "SAP Number",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "Contractor_Name",
									label : "Contractor Name",
									alias : "Contractor Name",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "City_State",
									label : "City & State",
									alias : "City & State",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "Tech",
									label : "Technology to Develop",
									alias : "Technology",
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "YTD",
									label : "YTD Actual",
									alias : "YTD",
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return formatCellMoney_nodecimal.call(
												this, data["YTD"])
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "Per50k",
									label : "% of $50K Target",
									alias : "Per50k",
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return (data["Per50k"] * 100)
												.toFixed(1)
												+ "%"
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								} ],

						postLoad : function() {
							// BCFTSGASDG-1563 - Disclaimer, a few SAP # have
						// not been added yet
						var html = "York Restoration for Ward Rowlands and Ardor Solutions for Vinh Nyugen will appear on the report after their first SAP purchase.";

						$('.gi_reports_2017_scoreboard p.labelDesc').html(html);
					}
					});
			return ret_list;
		},
		skill_testing_series : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 330) / 50);
				return (count > 0 ? count : 9);
			}
			var ret_list = new Grid(
					{
						container : $("." + global.currentpage.subclass
								+ " #report_skill_testing_series")[0],
						dataSource : global.database.Main + '/getReportSkillTestingSeries?OpenAgent',
						fetch : {
							schedule : "progressive",
							rows : rowcount()
						},
						height : rowcount() * 50,
						paging : "scroll",
						defaultFilters : function() {
							// this.filters = report_filters;
							// this.filters.add('view_as',viewAsOverlay.getListFilters());
						},
						hasFooter : true,
						tableClass : "list-template-main list-template1",
						columnModel : [
								{
									name : "Username",
									label : "Employee",
									alias : "Employee",
									/*
									 * style: { "min-width": '500px' },
									 */
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										return "Average";
									}
								},
								{
									name : "Test_1",
									label : "Theory Test 1\n\nUcrete\nJan-Feb 2017",
									alias : "Theory Test 1: Ucrete Jan-Feb 2017",
									style : {},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Test_1'] ? data['Test_1']
												+ "%" : 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Test_1'] ? data['Test_1']
												+ "%" : 'N/A';
									}
								},
								{
									name : "Test_2",
									label : "Theory Test 2\n\nMasterTop SRS\nFeb-Mar 2017",
									alias : "Theory Test 2: MasterTop SRS Feb-Mar 2017",
									style : {},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Test_2'] ? data['Test_2']
												+ "%" : 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Test_2'] ? data['Test_2']
												+ "%" : 'N/A';
									}
								},
								{
									name : "Test_3",
									label : "Hands-On Test 3\n\nMasterTop SRS\n& MasterTop",
									alias : "Hands-On Test 3: MasterTop SRS & MasterTop",
									style : {},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Test_3'] ? data['Test_3']
												+ "%" : 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Test_3'] ? data['Test_3']
												+ "%" : 'N/A';
									}
								},
								{
									name : "Test_4",
									label : "Theory Test 4\n\nMasterTop",
									alias : "Theory Test 4: MasterTop",
									style : {},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Test_4'] ? data['Test_4']
												+ "%" : 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Test_4'] ? data['Test_4']
												+ "%" : 'N/A';
									}
								},
								{
									name : "Test_5",
									label : "Theory Test 5\n\nAll Technologies",
									alias : "Theory Test 5: All Technologies",
									style : {},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Test_5'] ? data['Test_5']
												+ "%" : 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Test_5'] ? data['Test_5']
												+ "%" : 'N/A';
									}
								},
								{
									name : "Average",
									label : "Average",
									alias : "Average",
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										return data['Average'] ? data['Average']
												+ "%"
												: 'N/A';
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
										this.addClass('list-number');
										return data['Average'] ? data['Average']
												+ "%"
												: 'N/A';
									}
								} ],

						postLoad : function() {
						}
					});
			return ret_list;
		},

		kpis_scoreboard : function(options) {
			var ret_list = new Grid(
					{
						container : $("." + global.currentpage.subclass
								+ " #report_kpis_scoreboard")[0],
						dataSource : global.database.Main
								+ '/getReportGIKPIScoreboard?OpenAgent&init_id='
								+ options.init_id + '&repyear='
								+ options.repyear + '&repmonth='
								+ options.repmonth,
						fetch : {
							schedule : "progressive",
							rows : 20
						},
						paging : "scroll",
						defaultFilters : function() {
							// this.filters = report_filters;
							// this.filters.add('view_as',viewAsOverlay.getListFilters());
						},
						tableClass : "list-template-main list-template1",
						columnModel : [
								{
									name : "kpi_label",
									label : "KPIs",
									alias : "KPIs",
									/*
									 * style: { "min-width": '500px' },
									 */
									renderCell : function(data, i, depth) {
									},
									renderHeader : function(data, i) {
									},
									renderFooter : function(data, i) {
									}
								},
								{
									name : "target",
									label : "Target",
									alias : "Target",
									style : {
										"max-width" : '230px'
									},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										// BCFTSGASDG-1502 - Format numbers for
									// rows that contain sales information
									// if (data["kpi_label"].includes("Sales
									// Target")){
									if (data["kpi_label"]
											.indexOf("Sales Target") >= 0
											|| data["kpi_label"]
													.indexOf("Contractor Network") >= 0) {
										this.addClass('list-number');
										return Number(data.target)
												.toCurrencyWithOptions(0, '$',
														',');
									} else if (data["kpi_label"]
											.indexOf("Skills Testing Series") === 0) {
										// BCFTSGASDG-1564 - Format the
										// numbers into percentages
										return data.target + '%';
									}
								},
								renderHeader : function(data, i) {
								},
								renderFooter : function(data, i) {
								}
								},
								{
									name : "actual",
									label : "Actual",
									alias : "Actual",
									style : {
										"max-width" : '230px'
									},
									bodyClass : "list-number",
									renderCell : function(data, i, depth) {
										// BCFTSGASDG-1502 - Format numbers for
									// rows that contain sales information
									// if (data["kpi_label"].includes("Sales
									// Target")){
									if (data["kpi_label"]
											.indexOf("Sales Target") >= 0
											|| data["kpi_label"]
													.indexOf("Contractor Network") >= 0) {
										this.addClass('list-number');
										return Number(data.actual)
												.toCurrencyWithOptions(0, '$',
														',');
									} else if (data["kpi_label"]
											.indexOf("Skills Testing Series") === 0) {
										// BCFTSGASDG-1564 - Format the
										// numbers into percentages
										return data.actual + '%';
									}
								},
								renderHeader : function(data, i) {
								},
								renderFooter : function(data, i) {
								}
								} ],

						postLoad : function() {
						}
					});

			return ret_list;
		},

		salesrep_leaderboard : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 265) / 50);
				return (count > 0 ? count : 9);
			};

			var getColumnModel = function() {
				columnModel = [
						{
							name : "salesrep",
							label : "Sales Rep",
							alias : "Sales Rep",
							renderCell : function(data, i, depth) {
							},
							renderHeader : function(data, i) {
							},
							renderFooter : function(data, i) {
							}
						},
						{
							name : "region",
							label : "Region",
							alias : "Region",
							renderCell : function(data, i, depth) {
							},
							renderHeader : function(data, i) {
							},
							renderFooter : function(data, i) {
							}
						},
						{
							name : "activity1",
							label : global.GIReportActivityConfig.getLabel(
									options.init_id, 1),
							alias : "Activity 1",
							renderCell : function(data, i, depth) {
								var html = '<div class="box-container">';
								if (data["gi_effective"] == 1) {
									html += formatCellActivityProgress.call(
											this, data["activity1"]);
								} else {
									html += '<div class="colorbox cell-grey"></div>';
								}
								return html + '</div>';
							}
						},
						{
							name : "activity2",
							label : global.GIReportActivityConfig.getLabel(
									options.init_id, 2),
							alias : "Activity 2",
							renderCell : function(data, i, depth) {
								var html = '<div class="box-container">';
								if (data["gi_effective"] == 1) {
									html += formatCellActivityProgress.call(
											this, data["activity2"]);
								} else {
									html += '<div class="colorbox cell-grey"></div>';
								}
								return html + '</div>';
							}
						},
						{
							name : "activity3",
							label : global.GIReportActivityConfig.getLabel(
									options.init_id, 3),
							alias : "Activity 3",
							renderCell : function(data, i, depth) {
								var html = '<div class="box-container">';
								if (data["gi_effective"] == 1) {
									html += formatCellActivityProgress.call(
											this, data["activity3"]);
								} else {
									html += '<div class="colorbox cell-grey"></div>';
								}
								return html + '</div>';
							}
						},
						{
							name : "activity4",
							label : global.GIReportActivityConfig.getLabel(
									options.init_id, 4),
							alias : "Activity 4",
							renderCell : function(data, i, depth) {
								var html = '<div class="box-container">';
								if (data["gi_effective"] == 1) {
									html += formatCellActivityProgress.call(
											this, data["activity4"]);
								} else {
									html += '<div class="colorbox cell-grey"></div>';
								}
								return html + '</div>';
							}
						} ];

				// BCFTSGASDG-1332 - For GI 2017 Reports, remove columns that
				// are blank
				if (global.currentpage.subclass == 'gi_reports_2017_scoreboard') {
					for ( var i = columnModel.length - 1; i > 1; i--) {
						if (columnModel[i].label == '') {
							columnModel.pop();
						}
					}
				}

				if (global.currentpage.subclass == 'gi_reports_scoreboard') {
					var title = $('#gi_reports_scoreboard_header').text();
					if (title == 'P & I Grouts and Mortars') {
						columnModel
								.push( {
									name : "activity5",
									label : global.GIReportActivityConfig
											.getLabel(options.init_id, 5),
									alias : "Activity 5",
									renderCell : function(data, i, depth) {
										var html = '<div class="box-container">';
										if (data["gi_effective"] == 1) {
											html += formatCellActivityProgress
													.call(this,
															data["activity5"]);
										} else {
											html += '<div class="colorbox cell-grey"></div>';
										}
										return html + '</div>';
									}
								});
						for ( var i = 2; i < columnModel.length; ++i) {
							columnModel[i].style = {
								"max-width" : "175px",
								"min-width" : "140px"
							};
						}
					} else if (title.indexOf('KAM') >= 0
							|| title.indexOf('Flooring') > 0) {
						columnModel.pop();
						for ( var i = 2; i < columnModel.length; ++i) {
							columnModel[i].style = {
								"max-width" : "375px",
								"min-width" : "160px"
							};
						}
					} else {
						for ( var i = 2; i < columnModel.length; ++i) {
							columnModel[i].style = {
								"min-width" : "150px",
								"max-width" : "275px"
							};
						}
					}
				}

				return columnModel;
			};

			var ret_list = new Grid( {
				container : $("." + global.currentpage.subclass
						+ " #report_salesrep_leaderboard")[0],
				dataSource : global.database.Main
						+ '/getReportGISalesRepLeaderboard?OpenAgent&pageid='
						+ options.pageid + '&init_id=' + options.init_id
						+ '&repyear=' + options.repyear + '&repmonth='
						+ options.repmonth,
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
				},
				tableClass : "list-template-main list-template1",
				columnModel : getColumnModel(),
				postLoad : function() {
					$('.legendIcon').show();
				}
			});

			return ret_list;
		},

		financial_leaderboard : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 265) / 50);
				return (count > 0 ? count : 9);
			};

			// BCFTSGASDG-1502
			var getColumnModel = function() {
				columnModel = [
						{
							name : "salesrep",
							label : "Sales Rep",
							alias : "Sales Rep",
							renderCell : function(data, i, depth) {
							},
							renderHeader : function(data, i) {
							},
							renderFooter : function(data, i) {
							}
						},
						{
							name : "region",
							label : "Region",
							alias : "Region",
							renderCell : function(data, i, depth) {
							},
							renderHeader : function(data, i) {
							},
							renderFooter : function(data, i) {
							}
						},
						{
							name : "level1",
							label : "Level 1 Activities",
							alias : "Level 1 Activities",
							renderCell : function(data, i, depth) {
								var html = '<div class="box-container">';
								var count = 1;

								for ( var key in data) {
									// if (key.includes("activity") &&
									// global.GIReportActivityConfig.getLabel(options.init_id,
									// count) != ''){
									if (key.indexOf("activity") >= 0
											&& global.GIReportActivityConfig
													.getLabel(options.init_id,
															count) != '') {
										if (data["gi_member"] == 1
												&& data["gi_effective"] == 1) {
											html += formatCellActivityProgress
													.call(this, data[key]);
											count++;
										} else {
											html += '<div class="colorbox cell-grey"></div>';
											count++;
										}
									} else {
										html += "";
									}
									// BCFTSGASDG-1564 - Adding in the two
									// additional squares which appear only one
									// Ucrete 2017
									if (options.titleid === "ucrete_plus_2017") {
										if (key === 'activity6') {
											if (data["gi_member"] == 1
													&& data["gi_effective"] == 1) {
												html += formatCellSkillTestingSeries(data[key]);
											} else {
												html += '<div class="colorbox cell-grey"></div>';
											}
										} else if (key === 'activity7') {
											if (data["gi_member"] == 1
													&& data["gi_effective"] == 1) {
												html += formatCellExpandContractor(data[key]);
											} else {
												html += '<div class="colorbox cell-grey"></div>';
											}
										}
									}
								}
								return html + '</div>';
							}
						} ];

				switch (options.titleid) {
				case "ucrete_plus_2017":
				case "pi_grouts_2017":
					columnModel
							.push(
									{
										name : "level2Actual",
										label : options.titleid == "ucrete_plus_2017" ? "Level 2 Actual - Ucrete"
												: "Level 2 Actual",
										alias : "2017 Level 2 Actual",
										renderCell : function(data, i, depth) {
											return formatCellMoney_nodecimal
													.call(
															this,
															data["level2Actual"]);
										}
									},
									{
										name : "level2Financial",
										label : options.titleid == "ucrete_plus_2017" ? "Level 2 Target - Ucrete"
												: "Level 2 Target",
										alias : "2017 Level 2 Target",
										renderCell : function(data, i, depth) {
											return formatCellMoney_nodecimal
													.call(
															this,
															data["level2Financial"]);

										}
									},
									{
										name : "progress",
										label : "% Progress",
										alias : "% Progress",
										renderCell : function(data, i, depth) {
											formatCellPercentProgress.call(
													this,
													data["progress_color"]);
											this.addClass('list-number');
											return (data["progress"] * 100)
													.toFixed(1)
													+ "%";

										}
									},
									{
										name : "level3Actual",
										label : options.titleid == "ucrete_plus_2017" ? "Level 3 Actual - MTop SRS"
												: "S Level 3 Actual - MasterFlow 648",
										alias : "2017 Level 3 Actual",
										renderCell : function(data, i, depth) {
											return formatCellMoney_nodecimal
													.call(
															this,
															data["level3Actual"]);
										}
									},
									{
										name : "level3Financial",
										label : options.titleid == "ucrete_plus_2017" ? "Level 3 Target - MTop SRS"
												: "Level 3 Target - MasterFlow 648",
										alias : "2017 Level 3 Target",
										renderCell : function(data, i, depth) {
											return formatCellMoney_nodecimal
													.call(
															this,
															data["level3Financial"]);
										}
									});
					for ( var i = 2; i < columnModel.length - 1; ++i) {
						columnModel[i].style = {
							"min-width" : "150px",
							"max-width" : "275px"
						};
					}
					break;
				case "product_portfolio_2017":
				case "masterseal_awb_2017":
				case "masteremaco_mortars_2017":
					columnModel.push( {
						name : "level2Actual",
						label : "2017 Level 2 Actual",
						alias : "2017 Level 2 Actual",
						renderCell : function(data, i, depth) {
							return formatCellMoney_nodecimal.call(this,
									data["level2Actual"]);
						}
					}, {
						name : "level2Financial2",
						label : "2017 Level 2 Target",
						alias : "2017 Level 2 Target",
						renderCell : function(data, i, depth) {
							return formatCellMoney_nodecimal.call(this,
									data["level2Financial"]);
						}
					}, {
						name : "progress2",
						label : "% Progress",
						alias : "% Progress",
						renderCell : function(data, i, depth) {
							formatCellPercentProgress.call(this,
									data["progress_color"]);
							this.addClass('list-number');
							return (data["progress"] * 100).toFixed(1) + "%";
						}
					}, {
						name : "level3Financial3",
						label : "2017 Level 3 Target",
						alias : "2017 Level 3 Target",
						renderCell : function(data, i, depth) {
							return formatCellMoney_nodecimal.call(this,
									data["level3Financial"]);
						}
					});
					for ( var i = 2; i < columnModel.length - 1; ++i) {
						columnModel[i].style = {
							"min-width" : "150px",
							"max-width" : "275px"
						};
					}
					break;

				}

				return columnModel;
			};

			var ret_list = new Grid(
					{
						container : $("." + global.currentpage.subclass
								+ " #report_financial_leaderboard")[0],
						dataSource : global.database.Main
								+ '/getReportGISalesRepLeaderboard?OpenAgent&pageid='
								+ options.pageid + '&init_id='
								+ options.init_id + '&repyear='
								+ options.repyear + '&repmonth='
								+ options.repmonth,
						fetch : {
							schedule : "progressive",
							rows : rowcount()
						},
						height : rowcount() * 50,
						paging : "scroll",
						defaultFilters : function() {
						},
						tableClass : "list-template-main list-template1",
						columnModel : getColumnModel(),
						postLoad : function() {
							$('.legendIcon').show();

							var html = '<br />Level 1 Activities column<br />';
							for ( var i = 1; i <= 5; i++) {
								if (global.GIReportActivityConfig.getLabel(
										options.init_id, i) == '') {
									break;
								}
								html += 'Box '
										+ i
										+ ' : '
										+ global.GIReportActivityConfig
												.getLabel(options.init_id, i)
										+ '<br />';
							}
							html += '<br />Green: 100% - Complete<br />Yellow: 80% - 99.9%<br />Red: < 80%<br />';

							// BCFTSGASDG-1564 - For Ucrete 2017: Appending to
							// the bottom of the legend for the last two squares
							// in Level 1 Activities
							if (options.titleid == "ucrete_plus_2017") {
								html += "<br />Box 3: Skill Testing Series<br />";
								html += "<br />Green: >= 80%<br />Yellow: 75% - 79.99%<br />Red: < 75%<br />";
								html += "<br />Box 4: Expand Contractor Network<br />";
								html += "<br />Green: >= $50,000<br />Red: < $50,000 or N/A<br />";
							}
							$('.gi_reports_2017_scoreboard p.labelDesc').html(
									html);
						}
					});
			return ret_list;
		},

		regional_performance : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 310) / 50);
				return (count > 0 ? count : 9);
			}

			var ret_list = new Grid( {
				container : $("." + global.currentpage.subclass
						+ " #report_regional_performance")[0],
				dataSource : global.database.Main
						+ '/getReportGIRegionalPerformance?OpenAgent&pageid='
						+ options.pageid + '&init_id=' + options.init_id
						+ '&repyear=' + options.repyear + '&repmonth='
						+ options.repmonth,
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
				},
				tableClass : "list-template-main list-template1",
				hasFooter : true,
				columnModel : [
						{
							name : "region",
							label : "Region",
							alias : "Region",
							sortable : true,
							renderCell : function(data, i, depth) {
							},
							renderFooter : function(data, i) {
								this.css("text-align", "left");
								return "Total";
							},
							style : {
								"min-width" : "100px"
							}
						},
						{
							name : "ytdActual",
							label : "YTD Actual",
							alias : "YTD Actual",
							sortable : true,
							renderCell : function(data, i, depth) {
								return formatCellMoney_nodecimal.call(this,
										data["ytdActual"]);
							},
							renderFooter : function(data, i) {
								return formatCellMoney_nodecimal.call(this,
										data["Total_Actual"]);
							}
						},
						{
							name : "yrTarget",
							label : "Full Year Target",
							alias : "Full Year Target",
							sortable : true,
							renderCell : function(data, i, depth) {
								return formatCellMoney_nodecimal.call(this,
										data["yrTarget"]);
							},
							renderFooter : function(data, i) {
								return formatCellMoney_nodecimal.call(this,
										data["Total_Target"]);
							}
						},
						{
							name : "percentProgress",
							label : "% Progress",
							alias : "% Progress",
							sortable : true,
							renderCell : function(data, i, depth) {
								formatCellPercentProgress.call(this,
										data["progress_color"]);
								this.addClass('list-number');
								return (data["progress"] * 100).toFixed(1)
										+ "%";
							},
							style : {
								"min-width" : "150px",
								"max-width" : "200px"
							},
							renderFooter : function(data, i) {
								this.addClass('list-number');
								return (data["Total_Progress"] * 100)
										.toFixed(1)
										+ "%";
							}
						} ],
				postLoad : function() {
					$('.legendIcon').show();
				}
			});
			return ret_list;
		},

		close_projects : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 310) / 50);
				return (count > 0 ? count : 9);
			}
			var ret_list = new Grid( {
				container : $("." + global.currentpage.subclass
						+ " #report_close_projects")[0],
				dataSource : global.database.Main
						+ '/getReportGICloseProjects?OpenAgent&init_id='
						+ options.init_id + '&repyear=' + options.repyear
						+ '&repmonth=' + options.repmonth,
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
				},
				tableClass : "list-template-main list-template1",
				hasFooter : true,
				columnModel : [ {
					name : "salesrep",
					label : "Sales Rep",
					alias : "Sales Rep"
				}, {
					name : "region",
					label : "Region",
					alias : "Region"
				}, {
					name : "inProcess",
					label : "In Process",
					alias : "In Process",
					bodyClass : "list-number",
					renderFooter : function(data, i) {
						this.addClass('list-number');
						return data["SumInProcess"];
					}
				}, {
					name : "win",
					label : "Win",
					alias : "Win",
					bodyClass : "list-number",
					renderFooter : function(data, i) {
						this.addClass('list-number');
						return data["SumWin"];
					}
				}, {
					name : "loss",
					label : "Loss",
					alias : "Loss",
					bodyClass : "list-number",
					renderFooter : function(data, i) {
						this.addClass('list-number');
						return data["SumLoss"];
					}
				}, {
					name : "total",
					label : "Total",
					alias : "Total",
					bodyClass : "list-number",
					renderFooter : function(data, i) {
						this.addClass('list-number');
						return data["SumTotal"];
					}
				} ],
				postLoad : function() {
				}
			});

			return ret_list;

		},

		// BCFTSGASDG-1468 - Project Pipeline summary
		project_pipeline : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 310) / 50);
				return (count > 0 ? count : 9);
			}
			var ret_list = new Grid( {
				container : $("." + global.currentpage.subclass
						+ " #report_project_pipeline")[0],
				dataSource : global.database.Main
						+ '/getReportGIPipelineProjects?OpenAgent&init_id='
						+ options.init_id + '&repyear=' + options.repyear
						+ '&repmonth=' + options.repmonth,
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
				},
				tableClass : "list-template-main list-template1",
				hasFooter : true,
				columnModel : [
						{
							name : "salesrep",
							label : "Sales Rep",
							alias : "Sales Rep"
						},
						{
							name : "region",
							label : "Region",
							alias : "Region"
						},
						{
							name : "target",
							label : "Level II Target",
							alias : "Level II Target",
							renderCell : function(data, i, depth) {
								this.addClass('list-number');
								return Number(data.target)
										.toCurrencyWithOptions(0, '$', ',');
							},
							renderFooter : function(data, i) {
								this.addClass('list-number');
								return Number(data["SumSalesTarget"])
										.toCurrencyWithOptions(0, '$', ',');
							}
						},
						{
							name : "salesTarget",
							label : "Pipeline Sales Target",
							alias : "Pipeline Sales Target",
							renderCell : function(data, i, depth) {
								this.addClass('list-number');
								return Number(data.salesTarget)
										.toCurrencyWithOptions(0, '$', ',');
							},
							renderFooter : function(data, i) {
								this.addClass('list-number');
								return Number(data["SumPipelineTarget"])
										.toCurrencyWithOptions(0, '$', ',');
							}
						},
						{
							name : "pipelineVal",
							label : "Pipeline Value",
							alias : "Pipeline Value",
							renderCell : function(data, i, depth) {
								this.addClass('list-number');
								return Number(data.pipelineVal)
										.toCurrencyWithOptions(0, '$', ',');
							},
							renderFooter : function(data, i) {
								this.addClass('list-number');
								return Number(data["SumOppValue"])
										.toCurrencyWithOptions(0, '$', ',');
							}
						}, {
							name : "numProjects",
							label : "# of Opportunties",
							alias : "# of Opportunties",
							bodyClass : "list-number",
							renderFooter : function(data, i) {
								this.addClass('list-number');
								return data["SumNumOpportunities"];
							}
						}, {
							name : "ratio",
							label : "Ratio",
							alias : "Ratio",
							bodyClass : "list-number"
						// do we need a Total for this column too?
						// ,renderFooter: function(data, i) {
						// this.addClass('list-number');
						// return data["SumTotal"];
						// }
						} ],
				postLoad : function() {
				}
			});

			return ret_list;

		},

		tracking_projects : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 260) / 50);
				return (count > 0 ? count : 9);
			}

			var ret_list = new Grid( {
				container : $("#report_tracking_projects")[0],
				dataSource : global.database.Main
						+ '/getReportPITrackingProjects?OpenAgent&init_id='
						+ options.init_id + '&repyear=' + options.repyear
						+ '&repmonth=' + options.repmonth,
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
				},
				tableClass : "list-template-main list-template1",
				// columnModel:getReportColumns(),
				columnModel : getProjectTrackingReportColumns("Opp. Owner"),
				postLoad : function() {
				}
			});

			return ret_list;

		},

		tracking_projects_noGI : function(options) {
			// Set Filters
			prjtrack_report_filters.add('view_as', viewAsOverlay
					.getListFilters());

			var rowcount = function() {
				var count = Math.floor(($(window).height() - 260) / 50);
				return (count > 0 ? count : 9);
			}

			var ret_list = new Grid(
					{
						container : $("#report_tracking_projects_nogi")[0],
						dataSource : global.database.Main + '/getReportTrackingProjects_NoGI?OpenAgent',
						fetch : {
							schedule : "progressive",
							rows : rowcount()
						},
						height : rowcount() * 50,
						paging : "scroll",
						defaultFilters : function() {
							this.filters = prjtrack_report_filters;
						},
						tableClass : "list-template-main list-template1",
						columnModel : getProjectTrackingReportColumns_noGI(),
						listName : 'Report_PT',
						postLoad : function() {
							savedFilters_GetFilterNames('Report_PT');
						},
						constructFilter : function() {
							prjtrack_constructFilterObject();
						},
						applyFilters : function() {
							prjtrack_applyFilters();
						},
						applySavedFilter : function() {
							prjtrack_applySelectedFilter();
						},
						resetFilters : function(reloadlist) {
							resetPrjTrackReportFilters(reloadlist);
						}
					});
			return ret_list;
		},

		current_progression : function() {
			var ret_list = new List(
					{
						container_id : 'reportsCurrentProgression',
						listName : 'Sales_Report', // Changed as saved filter
						// use this and we need to
						// keep same saved filters
						// across all sales report
						selector : '#reportsCurrentProgression [data-id="list"]',
						nodatareturneddivid : 'reportsCurrentProgression [data-id="list-nodata-message"]',
						countperpage : 500, // hack
						dataSource : global.database.Main + '/getReportDataCurrentProgression?OpenAgent',
						defaultSorts : function() {
						},
						clearActions : function() {
							$('#reportsAveragePrice [data-id="list-search"]')
									.val('');
							this.defaultFilters();
						},
						prefilteropen : function() {
						},
						defaultFilters : function() {
							this.filters = report_filters;
						},
						noDataToggle : function(noData, elements) {

							List.prototype.noDataToggle.call(this, noData, $
									.extend(elements, {
										'freeze-pane' : $('.list-panes',
												'#reportsCurrentProgression')
									}));

						},
						buildHeader : function() {

							var data = this.data && this.data.length
									&& this.data[0] || {},

							orderedMonths = Object.keys(data).sort(
									function(a, b) {
										return a - b
									}),

							th = htmlWrap.bind(this, 'th'), td = htmlWrap.bind(
									this, 'th');

							var html = orderedMonths
									.map( function(month) {
										var date = new Date();
										date.setUTCDate(15); // Added -
											// Stanley Huang
											// -
											// BCFTSGASDG-931
											date.setUTCMonth(month - 1);
											return th(date.toString().split(
													/\s/ig)[1]);
										}).join('');

							if (!html.length) {
								html = td();
							}

							$('.table-head', $(this.selector)).html(html);
						},
						renderRow : function(rowData, index) {

							var orderedMonths = Object.keys(rowData).sort(
									function(a, b) {
										return a - b
									}), td = htmlWrap.bind(this, 'td'), td_number = htmlWrap
									.bind(this, 'td class="list-number"'), tr = htmlWrap
									.bind(this, 'tr');

							return tr(orderedMonths
									.map(
											function(month) {

												if (index < 2) {
													return td_number(Number(
															rowData[month])
															.toCurrency());
												} else {
													return td_number((rowData[month] * 100)
															.toFixed(1) + '%');
												}

											}).join(''));
						},
						postLoad : function() {
							$(
									'#reportsCurrentProgression [data-id="report-total-gross-sales"]')
									.html(
											this.options.totals["sales"
													+ global.reports.season]
													.toCurrency());
							$(
									'#reportsCurrentProgression [data-id="report-total-transfer-margin"]')
									.html(
											this.options.totals.margin
													.toCurrency());
							$(
									'#reportsCurrentProgression [data-id="report-total-transfer-margin-percent"]')
									.html(
											(this.options.totals.percentage * 100)
													.toFixed(1) + '%');

							// Added - 04/20/2016 - Helen Schroeder - Added to
							// prevent the targets overlay from appearing behind
							// this table.
							$(
									'#reportsCurrentProgression div.list-template-main.list-frozen')
									.css( {
										'z-index' : '0'
									});
							savedFilters_GetFilterNames('Sales_Report');
							this.buildHeader();
						},

						noDataToggle : function() {
							// TODO
					},
					constructFilter : function() {
						sales_constructFilterObject();
					},
					applyFilters : function() {
						sales_applyFilters();
					},
					applySavedFilter : function() {
						sales_applySelectedFilter();
					},
					resetFilters : function(reloadlist) {
						resetReportFilters(reloadlist);
					}
					});

			return ret_list;

		},

		mgmtreport_trackedprojects_detail : function(options) {
			var rowcount = function() {
				var count = Math.floor(($(window).height() - 260) / 50);
				return (count > 0 ? count : 9);
			}

			function getReportFilters() {
				var filters = options.filterManager ? options.filterManager.getFilters():{};
				$.extend(filters, {
					cat_type : options.cat_type,
					cat_value: options.cat_value,
					repname: options.repName,
					view_as : viewAsOverlay.getListFilters(),
					reportType : options.report_type
				});
				return filters;
			}
			/* BCFTSGASDG-1606 - OBSOLETE
			var getreportfilter = function() {
				var tracking_filters = new List_Map_Data();
				tracking_filters.add('cat_type', options.cat_type);
				tracking_filters.add('cat_value', options.cat_value);
				tracking_filters.add('repname', options.repName);
				tracking_filters.add('view_as', viewAsOverlay.getListFilters());
				$.extend(tracking_filters, mgmt_report_filters);
				return tracking_filters;
			}
			*/
			var ret_list = new Grid({
				container : $("#mgmtreports_ptdetails_list")[0],
				dataSource : global.database.Main + '/getMgmtReportProjectTrackingDetails?OpenAgent',
				fetch : {
					schedule : "progressive",
					rows : rowcount()
				},
				height : rowcount() * 50,
				paging : "scroll",
				defaultFilters : function() {
					this.filters = getReportFilters();
				},
				tableClass : "list-template-main list-template1",
				columnModel : getProjectTrackingReportColumns(options.report_type == 'bst'? 'Lead Source':'Opp. Owner'),
				postLoad : function() {
				}
			});

			return ret_list;
		},

		mgmtreport_prj_summary : function(options) {
		/* BCFTSGASDG-1606 - OBSOLETE
		mgmt_report_filters.add('view_as', viewAsOverlay.getListFilters());
		mgmt_report_filters.add('reportType', options.report_type)
		*/
		function getReportFilters() {
			var filters = options.filterManager ? options.filterManager.getFilters():{};
			$.extend(filters, {
				view_as : viewAsOverlay.getListFilters(),
				reportType : options.report_type
			});
			return filters;
		}

		function getColumnModel() {
			var model = [
			{
				name : "row_title",
				label : "Project Name",
				alias : "Project Name",
				style : {
					"max-width" : "300px"
				},
				frozen : true,
				renderCell : function(data, i, depth) {},
				renderHeader : function(data, i) {},
				renderFooter : function(data, i) {}
			},
			{
				name : "city",
				label : "City",
				alias : "City",
				style : {
					"max-width" : "100px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 0) return ''
				},
				renderHeader : function(data, i) {
				}
			},
			{
				name : "state",
				label : "State",
				alias : "State",
				style : {
					"max-width" : "100px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 0) return ''
				}
			},
			{
				name : "opp_value",
				label : "Total Opportunity Value",
				alias : "Total Opportunity Value",
				style : {
					"max-width" : "250px"
				},
				renderCell : function(data, i, depth) {
					this.addClass('list-number');
					if (Number(data['opp_value']) < 0) {
						this.addClass('negative-dollars');
						return '(' + Math.abs(
								Number(data['opp_value']))
								.toCurrencyWithOptions(0, '$',
										',') + ')';
					} else {
						this.removeClass('negative-dollars');
						return Number(data['opp_value']).toCurrencyWithOptions(0, '$',',');
					}
				},
				renderFooter : function(data, i) {
				}
			}, {
				name : "probability",
				label : "Probability",
				alias : "Probability",
				style : {
					"min-width" : "200px",
					"max-width" : "300px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 2) return ''
				}
			}, {
				name : "forecast_date",
				label : "Estimated Close Date",
				alias : "Estimated Close Date",
				style : {
					"max-width" : "200px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 2) return ''
				}
			}, {
				name : "w/l",
				label : "Win/Loss",
				alias : "Win/Loss",
				style : {
					"max-width" : "200px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 2) return ''
				}
			}, {
				name : "winning_manufacturer",
				label : "Manufacturer",
				alias : "Manufacturer",
				style : {
					"max-width" : "300px"
				},
				frozen : false,
				renderCell : function(data, i, depth) {
					if (depth !== 2) return ''
				}
			}];
			if( options.report_type == 'bst' ) {
				model.push({
					name : "lead_source",
					label : "Lead Source",
					alias : "Lead Source",
					style : {
						"max-width" : "300px"
					},
					frozen : false,
					renderCell : function(data, i, depth) {
						if (depth !== 2)
							return ''
					}
				});
			} else {
				model.push({
					name : "opportunity_owner",
					label : "Opp Owner",
					alias : "Opp Owner",
					style : {
						"max-width" : "300px"
					},
					frozen : false,
					renderCell : function(data, i, depth) {
						if (depth !== 2)
							return ''
					}
				});
			}
			return model;
		}

		var ret_list = new Grid({
			container : $('.mr-prj-sum-detail-list', options.$context)[0],
			fetch : {
				schedule : "all",
				rows : 10
			},
			height : 500,
			paging : "scroll",
			dataSource : global.database.Main + '/(getMgmtReportProjectSummary)?OpenAgent',
			defaultFilters : function() {
				this.filters = getReportFilters();
			},
			tableClass : "list-template-main list-template1",
			selection : false,
			hasFooter : false,
			categorized : true,
			columnModel : getColumnModel(),
			styleRow : function(data, i, depth) {
			},
			postLoadAlways : function() {
			}
		});

		return ret_list;
	},


    // BCFTSGASDG-1530
    mgmtreport_act_summary: function(options) {
        // mgmt_report_filters.add('listType',options.listType ||
        // 'trackprojbyregion');
        /* BCFTSGASDG-1606 - OBSOLETE
		mgmt_report_filters.add('view_as', viewAsOverlay.getListFilters());
		mgmt_report_filters.add('reportType', options.report_type);
		*/
		// This report is special, it does not have the filter pane available
		function getReportFilters() {
			return {
				viewBy: "region",
				year: global.season,
				view_as : viewAsOverlay.getListFilters(),
				reportType : options.report_type
			};
		}

        var ret_list = new Grid({
            container: $('#mr-act-sum-detail-list')[0],
            fetch: {
                schedule: "all",
                rows: 10
            },
            height: 500,
            paging: "scroll",
            dataSource: global.database.Main + '/(getMgmtReportActivitySummary)?OpenAgent',
            defaultFilters: function() {
            	this.filters = getReportFilters();
                /* BCFTSGASDG-1606 - OBSOLETE
				this.filters = $.extend(mgmt_report_filters, {
					viewBy : "region",
					year : global.season
				});
				*/
            },
            tableClass: "list-template-main list-template1",
            selection: false,
            hasFooter: false,
            categorized: true,
            columnModel: [{
                name: "name",
                label: "Name",
                alias: "Name",
                style: {
                    "max-width": "300px"
                },
                frozen: true
            }, {
                name: "meeting",
                label: "Meeting",
                alias: "Meeting",
                style: {
                    "max-width": "150px"
                },
                frozen: false
            }, {
                name: "lunch_learn",
                label: "Lunch & Learn",
                alias: "Lunch & Learn",
                style: {
                    "max-width": "150px"
                },
                frozen: false
            }, {
                name: "spec",
                label: "Spec Review/Discussion",
                alias: "Spec Review/Discussion",
                style: {
                    "max-width": "150px"
                }
            }, {
                name: "phone",
                label: "Phone Call",
                alias: "Phone Call",
                style: {
                    // "min-width" : "200px",
                    "max-width": "150px"
                },
                frozen: false

            }, {
                name: "email",
                label: "Email",
                alias: "Email",
                style: {
                    "max-width": "150px"
                },
                frozen: false
            }, {
                name: "event",
                label: "Event",
                alias: "Event",
                style: {
                    "max-width": "150px"
                },
                frozen: false
            }, {
                name: "other",
                label: "Other",
                alias: "Other",
                style: {
                    "max-width": "300px"
                },
                frozen: false
            }, {
                name: "total",
                label: "Total",
                alias: "Total",
                style: {
                    "max-width": "150px"// ,"background-color" : "#999999"
                },
                frozen: false
            }],
            styleRow: function(data, i, depth) {},
            postLoadAlways: function() {
        	/*
			 * for (i=0;i<global.currentlist.data.length;i++) {
			 * global.currentlist.data[i].dataLength =
			 * global.currentlist.data[i].data.length(); }
			 */
            }
        });

        return ret_list;
    },


		 mgmtreport_trackedprojects: function(options) {
            // Set Filters
			/* BCFTSGASDG-1606 - OBSOLETE
            mgmt_report_filters.add('listType', options.listType || 'trackprojbyregion');
            mgmt_report_filters.add('view_as', viewAsOverlay.getListFilters());
            mgmt_report_filters.add('reportType', options.report_type);
            */
			function getReportFilters() {
				var filters = options.filterManager? options.filterManager.getFilters():{};
				$.extend(filters, {
	            	view_as : viewAsOverlay.getListFilters(),
	            	reportType : options.report_type || '',
	            	listType : options.listType || (options.report_type == 'bst'? 'trackprojbyregion':'trackprojbysarea')
	            });
				return filters;
			}

            var rowcount = function() {
            	if( options.report_type == 'bst' ) {
            		var offset = 550;
            	} else {
            		var offset = 450;
            	}
                var count = Math.floor(($(window).height() - offset) / 50);
                return (count > 0 ? count : 10);
            }

            function mgmtrep_GenerateSummaryReport() {
                var footer = global.currentlist.footerData;
                var htmlSR = '';
                if( options.report_type == 'bst' ) {
                	var partial = '',
                		totals = {};
                	htmlSR	= '<table class="gridAlike" style="margin-bottom:0">'
                			+ '<tr><th>Name</th><th>Prospect(#)</th><th>Prospect($)</th><th>Won(#)</th><th>Won($)</th><th>Specified(#)</th><th>Specified($)</th>';

                	$.each(footer, function(busline, data){
                		// First add all values to the totals
                		$.each(data, function(key, val){
                			if( totals[key] ) {
                    			totals[key] += val;
                			} else {
                				totals[key] = val;
                			}
                		});
                		partial += '<tr>'
                				+  '<td>'+busline+'</td>'
                				+  '<td>'+data.Prospect_Count+'</td>'
                				+  '<td>'+Number(data.Prospect_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
                				+  '<td>'+data.Won_Count+'</td>'
                				+  '<td>'+Number(data.Won_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
                				+  '<td>'+data.Specified_Count+'</td>'
                				+  '<td>'+Number(data.Specified_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
                				+  '</tr>';
                	});
            		htmlSR	+= '<tr>'
	        				+  '<td>Total Opportunity</td>'
	        				+  '<td>'+totals.Prospect_Count+'</td>'
	        				+  '<td>'+Number(totals.Prospect_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
	        				+  '<td>'+totals.Won_Count+'</td>'
	        				+  '<td>'+Number(totals.Won_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
	        				+  '<td>'+totals.Specified_Count+'</td>'
	        				+  '<td>'+Number(totals.Specified_Value).toCurrencyWithOptions(0,'$',',')+'</td>'
	        				+  '</tr>'
	        				+  partial;
                			+ '</table>';
                } else {
                    htmlSR = '<table class="gridAlike" style="margin-bottom:0"><tr>'
                    htmlSR += '<th>Total Opportunity Value</th><th># Of Opportunities Tracked</th>'
                    htmlSR += '<th>Value of Opportunities Won To Date</th><th>Value of Opportunities In the Pipeline</th>'
                    htmlSR += '</tr><tr>'
                    // BCFTSGASDG-1463 - Remove decimals
                    htmlSR += '<td class="list-number">' + (footer.Total_Opp_Value).slice(0, -3) + '</td>'
                    htmlSR += '<td class="list-number">' + footer.Total_Cnt_Projects + '</td>'
                    htmlSR += '<td class="list-number">' + (footer.Total_Win).slice(0, -3) + '</td>'
                    htmlSR += '<td class="list-number">' + (footer.Total_Remaining).slice(0, -3) + '</td>'
                    htmlSR += '</tr></table>';
                }
                $('.mr-prtrk-summ-list', options.$context).html(htmlSR)
            }


            var ret_list = new Grid({
                container: $('.mr-prtrk-detail-list', options.$context)[0],
                fetch: {
                    schedule: "all",
                    rows: rowcount()
                },
                height: rowcount() * 50,
                paging: "scroll",
                dataSource: global.database.Main + '/(getMgmtReportProjectTracking)?OpenAgent',
                defaultFilters: function() {
                	this.filters = getReportFilters();
                	/* BCFTSGASDG-1606 - OBSOLETE
                    this.filters = mgmt_report_filters;
                    */
                },
                tableClass: "list-template-main list-template1",
                selection: false,
                hasFooter: false,
                categorized: true,
                onRowClick: function(rowData, indices, selected, event) {
                    if (rowData.showDetail) {
                        if (rowData.Fcst_Edited_By_Sector)
                            var cat_value = rowData.Fcst_Edited_By_Sector
                              , cat_type = 'Sector';
                        else if (rowData.Fcst_Product_Category)
                            var cat_value = rowData.Fcst_Product_Category
                              , cat_type = 'ProdCat';
                        else if (rowData.BST_Region) // BCFTSGASDG-1607 - Updated
                        	var cat_value = rowData.BST_Region
                        	  ,	cat_type = 'Region';
                        else
                            var cat_value = rowData.Fcst_Edited_By_Region
                              , cat_type = 'Region';

                        // The options object passed in the below page construction will be passed
                        // also to the initReport() call in the postLoad.
                        global.pages.mgmtreports_ptdetails.load({
                            repName: rowData.Name, // BCFTSGASDG-1607 - Updated
                            cat_value: cat_value,
                            cat_type: cat_type,
                            report_type: options.report_type, // Pass along
                            filterManager: options.filterManager // Pass along
                        });
                        // alert(rowData.Fcst_Edited_By)
                    }
                },
                columnModel: [{
                    name: "Name",
                    label: "Name",
                    alias: "Name",
                    style: {
                        "max-width": "450px"
                    },
                    frozen: true,
                    renderCell: function(data, i, depth) {
                    	/*
                        if (depth == 0) {
                            if (data.SalesArea)
                                return data.SalesArea;
                            else if (data.Fcst_Edited_By_Sector)
                                return data.Fcst_Edited_By_Sector;
                            else
                                return data.Fcst_Product_Category;
                        } else if (depth == 1) {
                            if (data.Fcst_Edited_By_Region)
                                return data.Fcst_Edited_By_Region;
                            else
                                return data.Fcst_Edited_By;
                        } else if (depth == 2) {
                            if (data.Fcst_Edited_By)
                                return data.Fcst_Edited_By;
                        }
                        */
                    },
                    renderHeader: function(data, i) {},
                    renderFooter: function(data, i) {}
                }, {
                    name: "Opp_Value",
                    label: "Total Opportunity Value",
                    alias: "Total Opportunity Value",
                    style: {
                        "max-width": "280px"
                    },
                    renderCell: function(data, i, depth) {
                        this.addClass('list-number');
                        if (Number(data["Opp_Value"]) < 0) {
                            this.addClass('negative-dollars');
                            return '(' + Math.abs(Number(data["Opp_Value"])).toCurrencyWithOptions(0, '$', ',') + ')';
                        } else {
                            this.removeClass('negative-dollars');
                            return Number(data["Opp_Value"]).toCurrencyWithOptions(0, '$', ',');
                        }
                    },
                    renderFooter: function(data, i) {}
                }, {
                    name: "Cnt_Projects",
                    label: "# of Opportunities Tracked",
                    alias: "# of Opportunities Tracked",
                    style: {
                        "max-width": "130px"
                    },
                    renderCell: function(data, i, depth) {
                        this.addClass('list-number');
                        return Number(data["Cnt_Projects"]);
                    },
                    renderFooter: function(data, i) {}
                }, {
                    name: "Win",
                    label: "Value of Opportunities Won To Date",
                    alias: "Value of Opportunities Won To Date",
                    style: {
                        "max-width": "200px"
                    },
                    renderCell: function(data, i, depth) {
                        this.addClass('list-number');
                        if (Number(data["Win"]) < 0) {
                            this.addClass('negative-dollars');
                            return '(' + Math.abs(Number(data["Win"])).toCurrencyWithOptions(0, '$', ',') + ')';
                        } else {
                            this.removeClass('negative-dollars');
                            return Number(data["Win"]).toCurrencyWithOptions(0, '$', ',');
                        }
                    },
                    renderFooter: function(data, i) {}
                }, {
                    name: "Remaining",
                    label: "Value of Opportunities in the Pipeline",
                    alias: "Value of Opportunities in the Pipeline",
                    style: {
                        "max-width": "300px"
                    },
                    renderCell: function(data, i, depth) {
                        this.addClass('list-number');
                        if (Number(data["Remaining"]) < 0) {
                            this.addClass('negative-dollars');
                            return '(' + Math.abs(Number(data["Remaining"])).toCurrencyWithOptions(0, '$', ',') + ')';
                        } else {
                            this.removeClass('negative-dollars');
                            return Number(data["Remaining"]).toCurrencyWithOptions(0, '$', ',');
                        }
                    },
                    renderFooter: function(data, i) {}
                }],
                styleRow: function(data, i, depth) {},
                postLoadAlways: function() {
                    mgmtrep_GenerateSummaryReport();
                },
				updateFilters: function(extension) {
					this.filters = getReportFilters();
					$.extend(this.filters, extension || {});
				},
				getNewData: function() {
					// Extends upon the prototype's getNewData
					$('.mr-prtrk-summ-list', options.$context).html('');
					Grid.prototype.getNewData.call(this);
				}
            });

            return ret_list;
        }
	}

	return function(options) {
		// initReport START
		switch (options.pageid) {
		case 'current_progression':
			global.currentlist = generateReportList(options.pageid, options);
			// The getData() call is necessary because generateReport() in the
			// case above will return a new List, not a new Grid. Lists do not
			// call getData implicitly.
			global.currentlist.getdata();
			break;
		case 'bst_sales':
			// BCFTSGASDG-1605 - BST Sales Reports
		case 'year_details':
		case 'year_summary':
		case 'average_price':
		case 'salesrep_leaderboard':
		case 'financial_leaderboard':
		case 'kpis_scoreboard':
		case 'close_projects':
			// BCFTSGASDG-1468 - Project Pipeline summary
		case 'project_pipeline':
			// BCFTSGASDG-1562 - New GI Report for Ucrete - Skills Testing
		case 'skill_testing_series':
			// BCFTSGASDG-1563 - New GI Report for Ucrete - Expand Contractor
			// Network
		case 'expand_contractor_network':
			// BCFTSGASDG-1502 - Regional Summary
		case 'regional_performance':
		case 'tracking_projects':
		case 'tracking_projects_noGI':
			global.currentlist = generateReportList(options.pageid, options);
			// new Grid() call getData() implicitly.
			// global.currentlist.getData();
			break;
		// BCFTSGASDG-1297 - Mgmt Reports
		case 'opportunities':
			if (options.report_type == 'bst') {
				$.each(['oppvalbybusline', 'oppvalbyprobability', 'oppvalbywinlost-multiyear'], function(index, val){
					mgmtrep_getoppdata($.extend({
						listType: val
					}, options));
				});
			} else {
				$.each(['oppvalbysector', 'oppvalbyprobability', 'oppvalbywinlost'], function(index, val){
					mgmtrep_getoppdata($.extend({
						listType: val
					}, options));
				});
			}

			// mgmtrep_loadBarChart("#mr-oppvalue-chart","",['Buildings &
			// Restoration','C & I
			// Flooring','Infrastructure','D','E'],'Opportunity Value',
			// [500,1000,3000,8250,2500]);
			// mgmtrep_loadBarChart("#mr-probability-chart","",['Prospect','Pre-Design/RFP','High
			// Probability','Bid Won','Closed -Lost'],'Opportunity Value',
			// [1500,100,13000,1250,5500]);
			break;
		case 'tracking':
			global.currentlist = generateReportList('mgmtreport_trackedprojects', options);
			mgmtrep_projecttracking_grid = global.currentlist;
			break;
		case 'tracking_details':
			global.currentlist = generateReportList('mgmtreport_trackedprojects_detail', options);
			break;
		case 'prj_summary':
			global.currentlist = generateReportList('mgmtreport_prj_summary', options);
			mgmtrep_projectsummary_grid = global.currentlist;
			break;
		case 'act_summary':
			global.currentlist = generateReportList('mgmtreport_act_summary', options);
			mgmtrep_activitysummary_grid = global.currentlist;
			break;
		}
	}
})();

function getScrollBarWidth() {
	var $outer = $('<div>').css( {
		visibility : 'hidden',
		width : 100,
		overflow : 'scroll'
	}).appendTo('body'), widthWithScroll = $('<div>').css( {
		width : '100%'
	}).appendTo($outer).outerWidth();
	$outer.remove();
	return 100 - widthWithScroll;
};
/* BCFTSGASDG-1606 - OBSOLETE
function changeMgmtReportFilterValue(id, value) {
	if (value == 'BN') {
		$('#' + id + '-div .filters-and-mgmt').show();
		$('#' + id + '-2').show();
		$('#' + id + '-div').addClass('filterBetweenSpacing').removeClass(
				'leftSpacing');
	} else {
		$('#' + id + '-div .filters-and-mgmt').hide();
		$('#' + id + '-2').hide();
		$('#' + id + '-div').removeClass('filterBetweenSpacing').addClass(
				'leftSpacing');
	}
}
*/

// BCFTSGASDG-1415 -- Added Project Tracking Report
function changePrjTrackReportFilterValue(id, value) {
	if (value == 'BN') {
		$('#' + id + '-div .filters-and-prjtrack').show();
		$('#' + id + '-2').show();
		$('#' + id + '-div').addClass('filterBetweenSpacing').removeClass(
				'leftSpacing');
	} else {
		$('#' + id + '-div .filters-and-prjtrack').hide();
		$('#' + id + '-2').hide();
		$('#' + id + '-div').removeClass('filterBetweenSpacing').addClass(
				'leftSpacing');
	}
}
