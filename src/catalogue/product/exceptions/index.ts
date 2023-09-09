import errors from './errors';
import BaseHttpException from '~shared/exceptions/base-http-exception';

export class NotFound extends BaseHttpException {
  constructor() {
    super(errors.NOT_FOUND);
  }
}

export class FailedUpdate extends BaseHttpException {
  constructor() {
    super(errors.FAILED_UPDATE);
  }
}

export class FailedCreate extends BaseHttpException {
  constructor() {
    super(errors.FAILED_CREATE);
  }
}

export class FailedDelete extends BaseHttpException {
  constructor() {
    super(errors.FAILED_DELETE);
  }
}

export class FailedToRelate extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_RELATE);
  }
}

export class FailedToGenerateVariants extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_GENERATE_VARIANTS);
  }
}

export class FailedToCheckDuplicateVariants extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_CHECK_DUPLICATE_VARIANTS);
  }
}

export class FailedToUpdateProductCategories extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_UPDATE_PRODUCT_CATEGORIES);
  }
}

export class FailedToAttach extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_ATTACH);
  }
}

export class FailedToManageCondition extends BaseHttpException {
  constructor() {
    super(errors.FAILED_TO_MANAGE_CONDITION);
  }
}
