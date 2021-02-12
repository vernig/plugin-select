@gverni/plugin-select
========================

This plugin for Twilio CLI allows for an easier selection of Twilio resources for display and selection.

Currently only selection of the Twilio project is enabled. More resources will be added in the future. 

## Install 

In your terminal type: 

```shell
twilio plugins:install @gverni/plugin-select
```

Once installed, type: 

```shell 
twilio select
```

If you see this: 

```shell
Select and switch your Twilio account / profile

USAGE
  $ twilio select:COMMAND

COMMANDS
  select:profile  Select and switch your Twilio account / profile
```

Then your plugin is correctly installed.

# Usage  

To select your Twilio project / account, type: 

```shell
twilio select:profile
```

A list of available profiles is shown, with the active one selected. Move the arrow and choose your profile. 