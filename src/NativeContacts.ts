/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry} from 'react-native';


export type EmailAddress = {
    label: string;
    email: string;
}

export type PhoneNumber = {
    label: string;
    number: string;
}

export type PostalAddress =  {
    label: string;
    formattedAddress: string;
    street: string;
    pobox: string;
    neighborhood: string;
    city: string;
    region: string;
    state: string;
    postCode: string;
    country: string;
}

export type InstantMessageAddress= {
    username: string;
    service: string;
}

export type Birthday = {
    day: number;
    month: number;
    year: number;
}

export type UrlAddress = {
    url: string;
    label: string;
}

export type Contact = {
    recordID: string;
    backTitle?: string;
    company?: string|null;
    emailAddresses?: EmailAddress[];
    displayName?: string;
    familyName?: string;
    givenName?: string;
    middleName?: string;
    jobTitle?: string;
    phoneNumbers?: PhoneNumber[];
    hasThumbnail?: boolean;
    thumbnailPath?: string;
    isStarred?: boolean;
    postalAddresses?: PostalAddress[];
    prefix?: string;
    suffix?: string;
    department?: string;
    birthday?: Birthday;
    imAddresses?: InstantMessageAddress[];
    urlAddresses?: UrlAddress[];
    note?: string;
}

export interface Spec extends TurboModule {
     getAll(): Promise<Contact[]>;
     getAllWithoutPhotos(): Promise<Contact[]>;
     getContactById(contactId: string): Promise<Contact | null>;
     getCount(): Promise<number>;
     getPhotoForId(contactId: string): Promise<string>;
     addContact(contact: Contact): Promise<Contact>;
     openContactForm(contact: Contact): Promise<Contact | null>;
     openExistingContact(contact: Contact): Promise<Contact>;
     viewExistingContact(contact: Contact): Promise<Contact | void>
     editExistingContact(contact: Contact): Promise<Contact>;
     updateContact(contact: Contact): Promise<void>;
     deleteContact(contact: Contact): Promise<void>;
     getContactsMatchingString(str: string): Promise<Contact[]>;
     getContactsByPhoneNumber(phoneNumber: string): Promise<Contact[]>;
     getContactsByEmailAddress(emailAddress: string): Promise<Contact[]>;
     checkPermission(): Promise<'authorized' | 'denied' | 'undefined'>;
     requestPermission(): Promise<'authorized' | 'denied' | 'undefined'>;
     writePhotoToPath(contactId: string, file: string): Promise<boolean>;
     iosEnableNotesUsage(enabled: boolean): void;
    
}
export default TurboModuleRegistry.get<Spec>('NativeContacts') as Spec | null;
