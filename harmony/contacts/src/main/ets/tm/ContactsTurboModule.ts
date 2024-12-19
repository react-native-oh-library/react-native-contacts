/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import contact from '@ohos.contact';
import abilityAccessCtrl, { Context, PermissionRequestResult, Permissions } from '@ohos.abilityAccessCtrl';
import { BusinessError } from '@ohos.base';
import bundleManager from '@ohos.bundle.bundleManager';
import { common, Want } from '@kit.AbilityKit';
import { BusinessError as KitBusinessError } from '@kit.BasicServicesKit';

type ContactsAuthorizationStatus = 'authorized' | 'denied' | 'undefined';
const permissions: Array<Permissions> = ['ohos.permission.READ_CONTACTS', 'ohos.permission.WRITE_CONTACTS'];

enum PageUrl {
  add = 'page_flag_save_contact',
  edit = 'page_flag_contact_details',
  view = 'page_flag_contact_details',
}

export class ContactsTurboModule extends TurboModule implements TM.NativeContacts.Spec {
  private context: Context;
  private EVENT_BIRTHDAY = contact.Event.EVENT_BIRTHDAY;

  constructor(ctx: TurboModuleContext) {
    super(ctx)
    this.context = this.ctx.uiAbilityContext;
  }

  private startContactsAbility(parameters: Record<string, Object> | undefined): void {
    let want: Want = {
      bundleName: 'com.ohos.contacts',
      abilityName: 'com.ohos.contacts.MainAbility',
    };
    if (parameters) {
      want.parameters = parameters;
    }
    const context: common.UIAbilityContext = this.context as common.UIAbilityContext;
    context.startAbility(want).then(() => {
      console.info('Start contacts ability successfully.');
    }).catch((err: KitBusinessError) => {
      console.error(`Failed to startAbility. Code: ${err.code}, message: ${err.message}`);
    });
  }

  private transformEmail(ohEmail: contact.Email): TM.NativeContacts.EmailAddress {
    return {
      label: ohEmail?.labelName,
      email: ohEmail?.email
    }
  }

  private transformOhEmail(rnEmail: TM.NativeContacts.EmailAddress): contact.Email {
    return {
      labelName: rnEmail?.label,
      email: rnEmail?.email
    }
  }

  private transformPhoneNumbers(ohPhoneNumber: contact.PhoneNumber): TM.NativeContacts.PhoneNumber {
    return {
      label: ohPhoneNumber?.labelName,
      number: ohPhoneNumber?.phoneNumber
    }
  }

  private transformOhPhoneNumbers(rnPhoneNumber: TM.NativeContacts.PhoneNumber): contact.PhoneNumber {
    return {
      labelName: rnPhoneNumber?.label,
      phoneNumber: rnPhoneNumber?.number
    }
  }

  private transformPostalAddress(ohPostalAddresses: contact.PostalAddress): TM.NativeContacts.PostalAddress {
    return {
      label: ohPostalAddresses?.labelName,
      formattedAddress: ohPostalAddresses?.postalAddress,
      street: ohPostalAddresses?.street,
      pobox: ohPostalAddresses?.pobox,
      neighborhood: ohPostalAddresses?.neighborhood,
      city: ohPostalAddresses?.city,
      region: ohPostalAddresses?.region,
      state: ohPostalAddresses?.region,
      postCode: ohPostalAddresses?.postcode,
      country: ohPostalAddresses?.country,
    }
  }

  private transformOhPostalAddress(rnPostalAddresses: TM.NativeContacts.PostalAddress): contact.PostalAddress {
    return {
      labelName: rnPostalAddresses?.label,
      postalAddress: rnPostalAddresses?.formattedAddress,
      street: rnPostalAddresses?.street,
      pobox: rnPostalAddresses?.pobox,
      neighborhood: rnPostalAddresses?.neighborhood,
      city: rnPostalAddresses?.city,
      region: rnPostalAddresses?.region,
      postcode: rnPostalAddresses?.postCode,
      country: rnPostalAddresses?.country,
    }
  }

  //联系人生日的日期格式不确定：
  private transformBirthday(ohEvent: contact.Event): TM.NativeContacts.Birthday {
    let eventDate = ohEvent.eventDate;
    let date = new Date(eventDate);
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // 月份从0开始，需要加1
    let day = date.getDate();
    return {
      day: day,
      month: month,
      year: year,
    }
  }

  private transformOhBirthday(rnEvent: TM.NativeContacts.Birthday): contact.Event {
    let day = rnEvent?.day;
    let month = rnEvent?.month;
    let year = rnEvent?.year;
    if (day && month && year) {
      return {
        eventDate: `${year}/${month}/${day}`,
        labelName: "birthday",
        labelId: this.EVENT_BIRTHDAY,
      }
    }
    return null;
  }

  private transformInstantMessageAddress(ohImAddress: contact.ImAddress): TM.NativeContacts.InstantMessageAddress {
    return {
      username: ohImAddress?.labelName,
      service: ohImAddress?.imAddress,
    }
  }

  private transformOhImAddress(rnImAddress: TM.NativeContacts.InstantMessageAddress): contact.ImAddress {
    return {
      labelName: rnImAddress?.username,
      imAddress: rnImAddress?.service,
    }
  }

  private transformUrlAddress(portrait: contact.Portrait): TM.NativeContacts.UrlAddress {

    if (portrait?.uri) {
      return {
        url: portrait?.uri,
        label: ''
      }
    }
    return null;
  }

  private transformContact(ctt: contact.Contact): TM.NativeContacts.Contact {
    let emails: TM.NativeContacts.EmailAddress[] = ctt?.emails?.map((ohEmail: contact.Email) => {
      return this.transformEmail(ohEmail)
    })
    let phoneNumbers: TM.NativeContacts.PhoneNumber[] = ctt?.phoneNumbers?.map((ohPhoneNumber: contact.PhoneNumber) => {
      return this.transformPhoneNumbers(ohPhoneNumber);
    })

    let postalAddresses: TM.NativeContacts.PostalAddress[] =
      ctt?.postalAddresses?.map((ohPostalAddresses: contact.PostalAddress) => {
        return this.transformPostalAddress(ohPostalAddresses);
      })
    let birthday: TM.NativeContacts.Birthday = null;
    let birthdayEvent: contact.Event =
      ctt?.events?.filter((evs: contact.Event) => evs?.labelId === this.EVENT_BIRTHDAY).shift();
    if (birthdayEvent) {
      birthday = this.transformBirthday(birthdayEvent)
    }
    let instantMessageAddress: TM.NativeContacts.InstantMessageAddress[] =
      ctt?.imAddresses?.map((ohimAddresses: contact.ImAddress) => {
        return this.transformInstantMessageAddress(ohimAddresses);
      })

    let urlAddress: TM.NativeContacts.UrlAddress = this.transformUrlAddress(ctt?.portrait);

    let hasThumbnail: boolean = false;
    if (ctt?.portrait?.uri) {
      hasThumbnail = true;
    }
    let contact: TM.NativeContacts.Contact = {
      recordID: ctt?.id?.toString(),
      backTitle: "", //取消或者后退
      company: ctt?.organization?.name,
      emailAddresses: emails,
      displayName: ctt?.nickName?.nickName,
      familyName: ctt?.name?.familyName,
      givenName: ctt?.name?.givenName,
      middleName: ctt?.name?.middleName,
      jobTitle: ctt?.organization?.title,
      phoneNumbers: phoneNumbers,
      hasThumbnail: hasThumbnail,
      thumbnailPath: ctt?.portrait?.uri,
      isStarred: false, //是否标星，没有这个字段
      postalAddresses: postalAddresses,
      prefix: ctt?.name?.namePrefix,
      suffix: ctt?.name?.nameSuffix,
      department: '', //部门
      birthday: birthday,
      imAddresses: instantMessageAddress,
      urlAddresses: [urlAddress], //图片地址
      note: ctt?.note?.noteContent,
    }
    return contact
  }

  private transformContactName(contact: contact.Contact, rnCtt: TM.NativeContacts.Contact) {
    let familyName = '';
    let givenName = '';
    let middleName = '';
    let namePrefix = '';
    let nameSuffix = '';

    if (rnCtt?.familyName) {
      familyName = rnCtt?.familyName;
    }
    if (rnCtt?.givenName) {
      givenName = rnCtt?.givenName;
    }
    if (rnCtt?.middleName) {
      middleName = rnCtt?.middleName;
    }
    if (rnCtt?.prefix) {
      namePrefix = rnCtt?.prefix;
    }
    if (rnCtt?.suffix) {
      nameSuffix = rnCtt?.suffix;
    }
    contact.name = {
      fullName: givenName + middleName + familyName,
      familyName: familyName,
      givenName: givenName,
      middleName: middleName,
      namePrefix: namePrefix,
      nameSuffix: nameSuffix,
    };
  }

  private transformOhContact(rnCtt: TM.NativeContacts.Contact): contact.Contact {
    let recordID = null;
    if (rnCtt?.recordID) {
      recordID = Number(rnCtt?.recordID);
    }
    let emails: contact.Email[] = [];
    if (rnCtt?.emailAddresses) {
      emails = rnCtt?.emailAddresses?.map((rnEmail: TM.NativeContacts.EmailAddress) => {
        return this.transformOhEmail(rnEmail)
      });
    }

    let phoneNumbers: contact.PhoneNumber[] = [];
    if (rnCtt?.phoneNumbers) {
      phoneNumbers = rnCtt?.phoneNumbers?.map((rnPhoneNumber: TM.NativeContacts.PhoneNumber) => {
        return this.transformOhPhoneNumbers(rnPhoneNumber);
      });
    }

    let postalAddresses: contact.PostalAddress[] = [];
    if (rnCtt?.postalAddresses) {
      postalAddresses = rnCtt?.postalAddresses?.map((rnPostalAddresses: TM.NativeContacts.PostalAddress) => {
        return this.transformOhPostalAddress(rnPostalAddresses);
      })
    }

    let birthdayEvent = null;
    if (rnCtt?.birthday) {
      birthdayEvent = this.transformOhBirthday(rnCtt.birthday)
    }

    let instantMessageAddress: contact.ImAddress[] = [];
    if (rnCtt?.imAddresses) {
      instantMessageAddress = rnCtt?.imAddresses?.map((rnImAddresses: TM.NativeContacts.InstantMessageAddress) => {
        return this.transformOhImAddress(rnImAddresses);
      })
    }

    let contact: contact.Contact = {
      id: recordID,
      emails: emails, //取消或者后退
      imAddresses: instantMessageAddress,
      phoneNumbers: phoneNumbers,
      postalAddresses: postalAddresses
    }
    this.transformContactName(contact, rnCtt);
    if (rnCtt?.displayName) {
      contact.nickName = {
        nickName: rnCtt?.displayName,
      }
    }
    if (rnCtt?.note) {
      contact.note = {
        noteContent: rnCtt?.note,
      }
    }
    if (rnCtt?.company && rnCtt?.jobTitle) {
      contact.organization = {
        name: rnCtt?.company,
        title: rnCtt?.jobTitle
      }
    }
    if (birthdayEvent) {
      contact.events = [birthdayEvent];
    }
    if (rnCtt?.thumbnailPath) {
      contact.portrait = {
        uri: rnCtt?.thumbnailPath,
      }
    }
    return contact
  }

  private queryContactKey(contactId: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      contact.queryKey(this.context, contactId, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        resolve(data);
      })
    });
  }

  getAll(): Promise<TM.NativeContacts.Contact[]> {
    return new Promise<TM.NativeContacts.Contact[]>((resolve, reject) => {
      contact.queryContacts(this.context, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        let contacts: TM.NativeContacts.Contact[] = [];
        data.forEach(item => {
          contacts.push(this.transformContact(item))
        });
        resolve(contacts);
      });
    });
  }

  getAllWithoutPhotos(): Promise<TM.NativeContacts.Contact[]> {
    return this.getAll();
  }

  getContactById(contactId: string): Promise<TM.NativeContacts.Contact | null> {
    if (isNaN(Number(contactId))) {
      throw new Error('contactId invalid');
    }
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      this.queryContactKey(Number(contactId)).then((key: string) => {
        contact.queryContact(this.context, key, (err: BusinessError, data) => {
          if (err) {
            throw err;
          }
          resolve(this.transformContact(data));
        })
      })
    });
  }

  getCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.getAll().then((data: TM.NativeContacts.Contact[]) => {
        resolve(data.length);
      });
    });
  }

  //注：获取不到头像url
  getPhotoForId(contactId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getContactById(contactId).then((contactOne: TM.NativeContacts.Contact) => {
        resolve(contactOne.thumbnailPath);
      });
    });
  }

  addContact(rnContact: TM.NativeContacts.Contact): Promise<TM.NativeContacts.Contact> {
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      contact.addContact(this.context, ohContact, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        this.getContactById(String(data)).then((addContact: TM.NativeContacts.Contact | null) => {
          resolve(addContact);
        });
      });
    });
  }

  //目前支持姓名和手机号传递，需要oh支持其他属性
  openContactForm(rnContact: TM.NativeContacts.Contact): Promise<TM.NativeContacts.Contact> {
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      this.startContactsAbility({
        contactName: ohContact.name?.fullName,
        phoneNumber: ohContact.phoneNumbers[0]?.phoneNumber,
        pageFlag: PageUrl.add,
      });
      resolve(rnContact);
    });
  }

  openExistingContact(rnContact: TM.NativeContacts.Contact): Promise<TM.NativeContacts.Contact> {
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      this.startContactsAbility({
        phoneNumber: ohContact.phoneNumbers[0]?.phoneNumber,
        pageFlag: PageUrl.edit,
      });
      resolve(rnContact);
    });
  }

  viewExistingContact(rnContact: TM.NativeContacts.Contact): Promise<TM.NativeContacts.Contact | null> {
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      this.startContactsAbility({
        contactId: ohContact.id,
        phoneNumber: ohContact.phoneNumbers[0]?.phoneNumber,
        pageFlag: PageUrl.view,
      });
      resolve(rnContact);
    });
  }

  //需要打开联系人界面
  editExistingContact(rnContact: TM.NativeContacts.Contact): Promise<TM.NativeContacts.Contact> {
    return new Promise<TM.NativeContacts.Contact>((resolve, reject) => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      this.startContactsAbility({
        phoneNumber: ohContact.phoneNumbers[0]?.phoneNumber,
        pageFlag: PageUrl.edit,
      });
      resolve(rnContact);
    });
  }

  updateContact(rnContact: TM.NativeContacts.Contact): Promise<void> {
    if (!rnContact.recordID) {
      throw new Error('recordID invalid');
    }
    return new Promise<void>(() => {
      let ohContact: contact.Contact = this.transformOhContact(rnContact);
      contact.updateContact(this.context, ohContact, (err: BusinessError) => {
        if (err) {
          throw err;
        }
      });
    });
  }

  deleteContact(rnContact: TM.NativeContacts.Contact): Promise<void> {
    if (isNaN(Number(rnContact?.recordID))) {
      throw new Error('contactId invalid');
    }
    return new Promise<void>(() => {
      this.queryContactKey(Number(rnContact?.recordID)).then((key: string) => {
        contact.deleteContact(this.context, key, (err: BusinessError) => {
          if (err) {
            throw err;
          }
        });
      })
    });
  }

  getContactsMatchingString(str: string): Promise<TM.NativeContacts.Contact[]> {
    return new Promise<TM.NativeContacts.Contact[]>((resolve, reject) => {
      contact.queryContacts(this.context, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        let contacts: TM.NativeContacts.Contact[] = [];
        data.forEach(item => {
          if (item?.name?.fullName && item?.name?.fullName.includes(str)) {
            contacts.push(this.transformContact(item))
          }
        });
        resolve(contacts);
      });
    });
  }

  getContactsByPhoneNumber(phoneNumber: string): Promise<TM.NativeContacts.Contact[]> {
    return new Promise<TM.NativeContacts.Contact[]>((resolve, reject) => {
      contact.queryContactsByPhoneNumber(this.context, phoneNumber, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        let contacts: TM.NativeContacts.Contact[] = [];
        data.forEach(item => {
          contacts.push(this.transformContact(item))
        });
        resolve(contacts);
      });
    });
  }

  getContactsByEmailAddress(emailAddress: string): Promise<TM.NativeContacts.Contact[]> {
    return new Promise<TM.NativeContacts.Contact[]>((resolve, reject) => {
      contact.queryContactsByEmail(this.context, emailAddress, (err: BusinessError, data) => {
        if (err) {
          throw err;
        }
        let contacts: TM.NativeContacts.Contact[] = [];
        data.forEach(item => {
          contacts.push(this.transformContact(item))
        });
        resolve(contacts);
      });
    });
  }

  private async checkAccessToken(permission: Permissions): Promise<abilityAccessCtrl.GrantStatus> {
    let atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    let grantStatus: abilityAccessCtrl.GrantStatus = abilityAccessCtrl.GrantStatus.PERMISSION_DENIED;
    let tokenId: number = 0;
    try {
      let bundleInfo: bundleManager.BundleInfo =
        await bundleManager.getBundleInfoForSelf(bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION);
      let appInfo: bundleManager.ApplicationInfo = bundleInfo.appInfo;
      tokenId = appInfo.accessTokenId;
    } catch (error) {
      throw error;
    }
    try {
      grantStatus = await atManager.checkAccessToken(tokenId, permission);
    } catch (error) {
      throw error;
    }
    return grantStatus;
  }

  checkPermission(): Promise<string> {
    return new Promise<ContactsAuthorizationStatus>(async (resolve, reject) => {
      let readGrantStatus: abilityAccessCtrl.GrantStatus = await this.checkAccessToken(permissions[0]);
      let writeGrantStatus: abilityAccessCtrl.GrantStatus = await this.checkAccessToken(permissions[1]);
      if (readGrantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED &&
        writeGrantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
        resolve('authorized');
      } else {
        resolve('denied');
      }
    })
  }

  requestPermission(): Promise<string> {
    return new Promise<ContactsAuthorizationStatus>(async (resolve, reject) => {
      let atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
      let permissionRequestResult: PermissionRequestResult =
        await atManager.requestPermissionsFromUser(this.context, permissions)
      let grantStatus: Array<number> = permissionRequestResult.authResults;
      let authorized: boolean = false;
      for (let i = 0; i < grantStatus.length; i++) {
        if (grantStatus[i] === 0) {
          authorized = true;
        } else {
          authorized = false;
          break;
        }
      }
      if (authorized) {
        resolve('authorized');
      } else {
        resolve('denied');
      }
    })
  }

  //OH 目前不支持
  writePhotoToPath(contactId: string, file: string): Promise<boolean> {
    throw new Error('Method not supported');
  }

  //不需要这个接口
  iosEnableNotesUsage(enabled: boolean): void {

  }
}