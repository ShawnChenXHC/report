

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
