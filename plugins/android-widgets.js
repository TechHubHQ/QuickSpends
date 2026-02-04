const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidWidgets = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    const receivers = [
      {
        $: {
          'android:name': '.widgets.QuickAddWidgetProvider',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/quick_add_widget_info',
            },
          },
        ],
      },
      {
        $: {
          'android:name': '.widgets.AnalyticsWidgetProvider',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/analytics_widget_info',
            },
          },
        ],
      },
    ];

    if (!application.receiver) {
      application.receiver = [];
    }
    application.receiver.push(...receivers);

    return config;
  });

  return config;
};

module.exports = withAndroidWidgets;