import { Module } from '@nestjs/common';
import { EditableRegionsModule } from './editable-regions/editable-regions.module';
import { RedirectsModule } from './redirects/redirects.module';
import { FormBuilderModule } from './form-builder/form-builder.module';
import { FormLogModule } from './form-log/form-log.module';
import { MediaLibraryModule } from './media-library/media-library.module';
import { MenuModule } from './menu/menu.module';
import { LocaleModule } from './locale/locale.module';
import { TranslationsModule } from './translations/translations.module';
import { MailLogModule } from './mail-log/mail-log.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [EditableRegionsModule, RedirectsModule, FormBuilderModule, FormLogModule, MediaLibraryModule, MenuModule, LocaleModule, TranslationsModule, MailLogModule, SettingsModule]
})
export class WebsiteModule {}
