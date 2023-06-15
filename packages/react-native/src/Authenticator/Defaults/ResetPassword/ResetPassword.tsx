import React, { useMemo } from 'react';
import { authenticatorTextUtil } from '@aws-amplify/ui';

import {
  DefaultContent,
  DefaultFooter,
  DefaultTextFormFields,
  DefaultHeader,
} from '../../common';
import { useFieldValues } from '../../hooks';

import { DefaultResetPasswordComponent } from '../types';

const COMPONENT_NAME = 'ResetPassword';
const {
  getResetYourPasswordText,
  getSendCodeText,
  getSendingText,
  getBackToSignInText,
} = authenticatorTextUtil;

const ResetPassword: DefaultResetPasswordComponent = ({
  fields,
  handleBlur,
  handleChange,
  handleSubmit,
  isPending,
  toSignIn,
  validationErrors,
  ...rest
}) => {
  const {
    disableFormSubmit: disabled,
    fields: fieldsWithHandlers,
    formValidationErrors,
    handleFormSubmit,
  } = useFieldValues({
    componentName: COMPONENT_NAME,
    fields,
    handleBlur,
    handleChange,
    handleSubmit,
    validationErrors,
  });

  const headerText = getResetYourPasswordText();
  const primaryButtonText = isPending ? getSendingText() : getSendCodeText();
  const secondaryButtonText = getBackToSignInText();

  const buttons = useMemo(
    () => ({
      primary: {
        children: primaryButtonText,
        disabled,
        onPress: handleFormSubmit,
      },
      links: [{ children: secondaryButtonText, onPress: toSignIn }],
    }),
    [
      disabled,
      handleFormSubmit,
      primaryButtonText,
      secondaryButtonText,
      toSignIn,
    ]
  );

  return (
    <DefaultContent
      {...rest}
      buttons={buttons}
      headerText={headerText}
      fields={fieldsWithHandlers}
      isPending={isPending}
      validationErrors={formValidationErrors}
    />
  );
};

ResetPassword.Footer = DefaultFooter;
ResetPassword.FormFields = DefaultTextFormFields;
ResetPassword.Header = DefaultHeader;

ResetPassword.displayName = COMPONENT_NAME;
export default ResetPassword;
