import { RNPackage, TurboModulesFactory } from 'rnoh/ts';
import type {
  TurboModule,
  TurboModuleContext
} from 'rnoh/ts';
import { TM } from "rnoh/generated/ts"
import { ContactsTurboModule } from './tm/ContactsTurboModule';
class ContactsTurboModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.NativeContacts.NAME) {
      return new ContactsTurboModule(this.ctx);
    }
    return null;
  }
  hasTurboModule(name: string): boolean {
    return name === TM.NativeContacts.NAME;
  }
}
export class ContactsPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new ContactsTurboModulesFactory(ctx);
  }
}