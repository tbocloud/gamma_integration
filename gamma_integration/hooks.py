app_name = "gamma_integration"
app_title = "Gamma Integration"
app_publisher = "Your Company"
app_description = "Gamma.app integration for Frappe/ERPNext"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "your-email@company.com"
app_license = "MIT"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "gamma_integration",
# 		"logo": "/assets/gamma_integration/logo.png",
# 		"title": "Gamma Integration",
# 		"route": "/gamma_integration",
# 		"has_permission": "gamma_integration.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/gamma_integration/css/gamma_integration.css"
app_include_js = "/assets/gamma_integration/js/gamma_integration.js"

# include js, css files in header of web template
# web_include_css = "/assets/gamma_integration/css/gamma_integration.css"
# web_include_js = "/assets/gamma_integration/js/gamma_integration.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "gamma_integration/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "gamma_integration/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "gamma_integration.utils.jinja_methods",
# 	"filters": "gamma_integration.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "gamma_integration.install.before_install"
# after_install = "gamma_integration.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "gamma_integration.uninstall.before_uninstall"
# after_uninstall = "gamma_integration.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "gamma_integration.utils.before_app_install"
# after_app_install = "gamma_integration.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "gamma_integration.utils.before_app_uninstall"
# after_app_uninstall = "gamma_integration.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "gamma_integration.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# Document Events
doc_events = {
    "Quotation": {
        "on_update": "gamma_integration.gamma_integration.doctype.gamma_proposal.gamma_proposal.sync_quotation_data"
    }
}

# Fixtures
fixtures = [
    "Custom Field",
    "Property Setter"
]

# API endpoints
api_methods = {
    "gamma_integration.api.create_gamma_proposal": "gamma_integration.gamma_integration.api.create_gamma_proposal",
    "gamma_integration.api.sync_gamma_data": "gamma_integration.gamma_integration.api.sync_gamma_data"
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"gamma_integration.tasks.all"
# 	],
# 	"daily": [
# 		"gamma_integration.tasks.daily"
# 	],
# 	"hourly": [
# 		"gamma_integration.tasks.hourly"
# 	],
# 	"weekly": [
# 		"gamma_integration.tasks.weekly"
# 	],
# 	"monthly": [
# 		"gamma_integration.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "gamma_integration.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "gamma_integration.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "gamma_integration.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["gamma_integration.utils.before_request"]
# after_request = ["gamma_integration.utils.after_request"]

# Job Events
# ----------
# before_job = ["gamma_integration.utils.before_job"]
# after_job = ["gamma_integration.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"gamma_integration.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

