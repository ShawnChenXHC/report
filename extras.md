

The purpose of this report is thus to provide the first
step in the process of improving the filters by

The purpose of this report is thus to

The importance of the Management Report
Filters demands that its implementation be carefully considered and
well-designed. This report will

The author thus sought to update the
system with the objective of making it more flexible, streamlined and resilient
to change. The purpose of this report is thus two-fold. First, it will examine
and provide an analysis of the existing infrastructure in order to highlight
its deficiencies. Second, it will detail the author's solution and discuss how
it addresses the weaknesses of the old system.

This purpose is perhaps more clearly demonstrated when one examines the "Click"
event handler placed upon the "Apply" button in the filter pane (Figure 2.1).

``` JS
// body is equal to $(document.body)
body.on('click', '[data-id="report-filter-apply"], [data-id="mgmt-report-filter-apply"]', function() {

  /* ... */

  if ($('#filters-mgmt-checkbox1').is(":checked")) {
    if ($('#filters-mgmt-comparison').val() == "BN") {
      mgmt_report_filters.opp_value = /* .. */;
    } else {
      mgmt_report_filters.opp_value = /* ... */;
    }
  } else {
    mgmt_report_filters.opp_value = /* ... */;
  }

  /* ... */

	setMgmtReportFilters(mgmt_report_filters);

	if (page_id == 'opportunities' || page_id == 'prj_summary') {
		global.pages.mgmtreports.load({
			pageid: page_id
		});
	} else {
		/* ... */
		global.currentlist.getNewData();
	}

  /* ... */

});
```
**Figure 2.1: The "Click" event handler on the "Apply" button**

As one can see, the event handler shown above is being applied to any element
whose `data-id` attribute is equal to one of "report-filter-apply" and
"mgmt-report-filter-apply". In practice, this means that this "Click" event
handler is being attached to two different "Apply" buttons. This seemingly
innocuous practice is another weakness of the system which is discussed in
further detail in section 2.1.2.

First, the line `setMgmtReportFilters(mgmt_report_filters);` must be brought to
attention. This is arguably the most important line of the function. Here, a
global function, `setMgmtReportFilters()`, is called and given



### 2.1.1 - Inconsistency

The function is neither consistent with itself nor with other parts of the
Application.

### 2.1.2 - Modularity

One of the principle advantages of Objected Oriented Programming is that it
enables a

The system is not very modular. A look into some of the bindings defined in
`init_reports()` reveal this.

### 2.1.3 - Repetition

The Don't Repeat Yourself (DRY) Principle is a well-established pillar in good
program design.


### 2.2 - The Newer System


******


For the aforementioned purposes, the author now finds it necessary to provide a
walkthrough of the old system. Two things, however, must be noted before
continuing. First, unless special exception is noted, all subsequent code to be
shown in this report comes from the file `reports.js`. Second, in all code
shown, the appearance of the sequence of characters `/* ... */` is to denote
code omitted for the purpose of keeping this report short and concise.

In brief, the Management Report Filters work as follows:

1.  When the Application first starts, a function called `init_reports()` is
    called.
2.  This function creates a *closure*, within which a variable,
    `mgmt_report_filters`, is defined. This variable keeps track of the state
    of the controls in the filters panel.
3.  When the user interacts with the filters panel, the selections and inputs
    they give are, for the most part, registered and stored in
    `mgmt_report_filters`.
4.  When the user clicks on the "Apply" button in the filters panel, the
    contents of `mgmt_report_filters` is copied over to a "mirror" Object in
    the closure of the `initReport()` function.
5.  This mirror Object is *stringified* and inserted into the URL of various
    various requests via `$.ajax()`, thus sending the filter information to
    the backend and ensuring that the response returned is filtered.

Having outlined the system, the following sections will dive into the system
in greater depth, with an emphasis on highlighting its weaknesses.


******


Situations like these are one of the primary reasons why Object Oriented
Programming has become such a become such a popular paradigm. By facilitating
abstractions in design.

One of the greatest benefits of Object Oriented Programming is that it
facilitates abstraction and modularity in design, giving one the benefit of
eliminating repetitive code

One of the greatest ben

In terms of design, this shows that the
behaviour of the "Regions" filter control is shared by many other

In terms of design, this shows that the
behavi

Because the behaviour of the "Regions" filter is common across many different
filter controls, this event handler has been attached to


******


The author has omitted much of the function, but has kept the parts which
outlines the shortcomings of the

The author has purposefully omitted much

Much of the event handler has been omitted for the sake of brevity, but enough
has been shown to demonstrate the issue.

Because the "Regions" filter control is

As one can see from the call to `on()`


This event handler, as one can tell
from the selector being passed to `on()`, is being attached multiple elements.

Much of the event handler has been omitted for the sake of brevity, but enough
has been shown to demonstrate the issue. As one can see from the selector
given to


******


In any case, Figure 2.1 shows that when the user clicks on the "Apply" button
in the Filters, the first thing that happens is

In any case, Figure 2.1 shows that when the user clicks on the "Apply" button,
the event handler will first set `mgmt_report_filters.opp_value` to some value
depending on the

As one can see, the event handler shown above is actually being applied to two
different sets of elements, those whose `data-id` attribute is equal to
"report-filter-apply" and

As one can see, the event handler shown above is actually being attached to two
different elements, one with `[data-id="report-filter-apply"]`




These three steps will now be elaborated upon in detail.

1.  When the Application first starts, a function called `init_reports()`,
    defined in `report.js`, is called to execute once. This function creates a
    closure, within which a variable, `mgmt_report_filters`, is defined and
    used to keep track of the current state of the filters.
2.  The `init_reports()` function also defines a number of event handlers that
    are executed when controls in the filters change. They register input from
    the user and update `mgmt_report_filters` accordingly.
3.  The `init`


In brief, the Management Report Filters are implemented in three steps.

1.  When the Application is first loaded, a function called `init_reports()'`,
    defined in `report.js`, is called to execute once. This function prepares a
    number of global variables and defines a number of event handlers that are
    later used in order to get the Filters to work.
2.  When the user interacts with certain elements within the filters panel,
    event handlers set earlier by `init_reports()` will be invoked in order to
    respond to the selections the user has made.
3.  When the user clicks on the "Save" button in the filters panel, a `click`
    event handler set on the "Save" button will execute and apply the filters.


Since a large amount of dat could potentially be displayed, it was necessary to provide the management users with a method to round down the data set from which the reports draw from

A key component of the Management Reports is the filters panel. This panel provides several controls the user can use in order to round

These filters serve an important
role by giving the user multiple perspectives on their data.

Because of the large amount of data that could be gathered and displayed here,
these reports share a common filters panel that allows the user to round down
and specify the source data set.

These filters are the focus of discussion for this particular work term report.

**[INSERT FIGURE 1]**  
**Figure 1: An example of what a type page in Reports**


```JavaScript
var a_test = 1
for( i = 0; i < 10; i++ ) {

}
```   
**Figure 2: The init_report() function**

clarity, insight, perspective, optimize

The Builder Connect application (Henceforth referred to as the "Application")
contains many tools that enable our clients to better engage with their
customers. It provides, among other things, company profiling, project
tracking, data analysis and event scheduling. The Reports page, accessible via
the top navigation bar, is one of the application's key features. It provides
multiple different reports that give the client greater insight into their
data.

The Builder Connect Application (Henceforth referred to simply as the
"Application") is one of the many marketing and analytical tools that Kenna
provides to its clients. The suite of features the Application provides include
sales tracking tools, company profiling, calendars with automatic
notifications,

The suite of features provided by the Application include sales tracking tools,
company profiling, event/deadline calendars with automatic notifications, team
organization tools

These solutions, when combined, empower our clients to  by giving them greater
insight into their data,


the Management reports provide the user with up-to-date information on the status
of the user's team and helps them make plans for their team moving forward.

The Management Reports enable users in an administrative role to get a better

The Management Reports provide users in an administrative role with a better
sense of what their team is currently doing. It collects data from their team
members and tracks their current progression.

the Management Reports draws data from the

The Management Reports provide users in an administrative role with
indispensable data and information regarding their team. The
