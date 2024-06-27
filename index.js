import { TurboModuleRegistry } from "react-native";
var ReactNative = require('react-native')
module.exports =  TurboModuleRegistry?TurboModuleRegistry.get('NativeContacts'):ReactNative.NativeModules.Contacts
