# Report Draft

## List of Figures

 # | Caption
--- | ---
1.0 | Navigating to the Management Reports
1.1 | The Management Report Filters
2.0 | The start of init_report()

## 1.0 - Introduction

The Builder Connect Application (Henceforth referred to simply as the
"Application") is a product that Kenna provides to its clients at BASF
Construction North America. It is a comprehensive suite of tools and solutions
that enable BASF marketing professionals to make better-informed decisions and
to better engage with their customers. Its features include a detailed company
profiling system, an easy-to-use projects tracker, a built-in calendar and
scheduling service with automatic notifications, as well as many other useful
tools.

The Application derives much value from its Reporting Utilities. Easily
accessible via the top navigation bar, the "Reports" sections of the Application
shows various reports generated form the data the application has collected
from its users. A series of charts, graphs and tables provide the client with
greater clarity and insight into their data.

Because the Application accommodates for different classes of users, the
Reports section likewise will also show different reports depending on the
specific roles and responsibilities of the current user. Here, attention must
be brought to a set of reports provided exclusively to the team leaders
and administrative users registered within the application. Accessed via the
"Mgmt Reports" tab in the sliding side navigation bar (Figure 1.0), the
Management Reports are an indispensable source of information for users in an
organizational role. These reports track the current progression of the user's
team members and provide up-to-date data to help the user plan for the future.

**[INSERT FIGURE 1.0]**  
**Figure 1.0: Navigating to the Management Reports**

A key component of the Management Reports is the filters panel (Figure 1.1).
This panel provides a number of controls which management users can use in order
to fine-tune the dataset the reports draw from. This unassuming feature is a
crucial component of the Management Reports because it provides the user with
greater depth into their data, giving them multiple perspectives and,
therefore, allowing them to optimize their future strategy. These filters are
the focus of discussions in this report.

**[INSERT FIGURE 1.1]**  
**Figure 1.1: The Management Report Filters**

When this author was tasked with adding a number of newer controls to the
Management Report Filters (Henceforth also referred to simply as "Filters"), he
had to examine the existing infrastructure to understand how the filters
worked. In doing so, the author discovered several points of weakness in the
existing framework which created unnecessary complications and made future
maintenance and expansion difficult. The author thus sought to amend and update
the system with the objective of making it more flexible, streamlined and
resilient to change. The purpose of this report is thus two-fold. First, it
will examine and provide an analysis of the existing infrastructure in order to
highlight its deficiencies. Second, it will detail the author's solution and
discuss how it addresses the weaknesses of the old system.

## 2.0 - Analysis

### 2.1 - The Existing Infrastructure

For the aforementioned purposes, the author now finds it necessary to provide a
walkthrough of the old system. Two things, however, must be noted before
continuing. First, unless special exception is noted, all subsequent code to be
shown comes from the file `reports.js`. Second, in all code shown, the
appearance of the sequence of characters `/* ... */` is to denote code omitted
for the purpose of keeping this report short and concise.

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

### 2.1.1 - An Inconsistent System

As one can see from Figure 2.0, the `init_reports()` function is an Immediately
Invoked Function Expression. This creates an enclosure within which the
variable `mgmt_report_filters` is defined:

``` JS
var init_reports = (function() {
	var report_filters = new List_Map_Data();
	var mgmt_report_filters = new List_Map_Data();
	var prjtrack_report_filters = new List_Map_Data();

  /* ... */

  return function(body) {
    // ...
  }
})();
```
**Figure 2.0: The start of init_reports()**

`mgmt_report_filters` is defined as an instance of the `List_Map_Data` class.
The `List_Map_Data` is a simple wrapper class for the plain JavaScript Object,
and instances of it can be treated like a regular Object. The purpose of the
`mgmt_report_filters` is to keep track of the current state of controls within
the filters panel.

### 2.1.1 - The Initialization Step

Like the stage crew of a theatrical production, the `init_reports()` function
is responsible for setting the stage in which the "act" of the Reports pages
will play out. It is an immense function whose many lines not only set up the
Management Report Filters, but most everything else in the Reports sections as
well.

The function, with a large amount of omitted code, is shown in figure 2.0.


As one can see, `mgmt_report_filters` is among a trio `List_Map_Data` objects.
The `List_Map_Data` class is a simple wrapper for a JavaScript (JS) Object, and
one can treat instances of it just like any plain JS Object. The role of
`mgmt_report_filters` is to keep track of the current state of the filters
panel.

As one can see, `mgmt_report_filters` is among a trio of `List_Map_Data`
objects. The `List_Map_Data` class is a simple wrapper for a plain JavaScript
(JS) Object, and one can treat instances of it just any plain JS Object.

In the old system, the main role of `mgmt_report_filters` is to keep track

### 2.1.1 - Inconsistency

The function is neither consistent with itself nor with other parts of the
Application.

### 2.1.2 - Repetition

The Don't Repeat Yourself (DRY) Principle is a well-established pillar in good
program design.

### 2.1.3 - Modularity

The system is not very modular. A look into some of the bindings defined in
`init_reports()` reveal this.

### 2.2 - The Newer System
