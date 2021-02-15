Twilio CLI plugin-select
========================

This plugin for Twilio CLI allows for an easier selection of Twilio resources for display and selection.

Currently only selection of the Twilio project is enabled. More resources will be added in the future. 

## Install 

In your terminal type: 

```shell
twilio plugins:install vernig/plugin-select
```

Once installed, type: 

```shell 
twilio select
```

If you see this: 

```shell
Easily select and display your Twilio resource

USAGE
  $ twilio select:COMMAND

COMMANDS
  select:flexconfig  Update, backup and restore your Flex Configuration
  select:profile     Select and switch your Twilio account / profile
```

Then your plugin is correctly installed.

# Commands  

* [`twilio select:profile`](#twilio-selectprofile)
* [`twilio select:flexconfig:update`](#twilio-selectflexconfigupdate)
* [`twilio select:flexconfig:backup`](#twilio-selectflexconfigbackup)
* [`twilio select:flexconfig:restore`](#twilio-selectflexconfigrestore)

## `twilio select:profile`
To select your Twilio project / account, type: 

```shell
twilio select:profile
```

A list of available profiles is shown, with the active one selected. Move the arrow and choose your profile. 

## `twilio select:flexconfig:update` 
Update your Flex configuration. Before using it, make sure you are logged in into a Flex project. 

```shell
twilio select:flexconfig:update
```

Before updating the Flex configuration, the plugin will autosave the current configuration in a file called `flexconfig_<account sid>_<timestamp>.json` in the same folder where the command has been executed in. 

Note: Some Flex configuration cannot be changes, and those include `account_sid`, `status`, `flex_service_instance_sid`, `runtime_domain`, `taskrouter_workspace_sid`, `service_version`, `taskrouter_offline_activity_sid`. 

## `twilio select:flexconfig:backup` 
Backup to local file the currrent Flex configuration. 

```shell
twilio select:flexconfig:backup
```

The configuration is stored in a file called `flexconfig_<account sid>_<timestamp>.json` in the same folder where the command has been executed in.

The generated file can be used with the [`restore`](#twilio-selectflexconfigrestore) command. 

## `twilio select:flexconfig:restore` 

Restore the Flex configuration from file. 

```shell
twilio select:flexconfig:restore
```

The plugin will show the files in the current directory whose file name is `flexconfig_AC*`. 