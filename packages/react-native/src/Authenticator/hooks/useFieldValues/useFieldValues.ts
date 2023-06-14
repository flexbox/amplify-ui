import { useCallback, useMemo, useState } from 'react';
import { Logger } from 'aws-amplify';
import {
  ValidationError,
  authenticatorTextUtil,
  isValidEmail,
} from '@aws-amplify/ui';

import {
  OnChangeText,
  TextFieldOnBlur,
  TextFieldOptionsType,
  TypedField,
} from '../types';

import { UseFieldValues, UseFieldValuesParams } from './types';
import {
  getSanitizedTextFields,
  getSanitizedRadioFields,
  isRadioFieldOptions,
} from './utils';

const logger = new Logger('Authenticator');

const { getInvalidEmailText, getRequiredFieldText } = authenticatorTextUtil;

export default function useFieldValues<FieldType extends TypedField>({
  componentName,
  fields = [],
  handleBlur,
  handleChange,
  handleSubmit,
  validationErrors,
}: UseFieldValuesParams<FieldType>): UseFieldValues<FieldType> {
  const [values, setValues] = useState<Record<string, string>>({});
  const [formValidationErrors, setFormValidationErrors] =
    useState<ValidationError>({});
  const isRadioFieldComponent = componentName === 'VerifyUser';

  const sanitizedFields = useMemo(() => {
    if (!Array.isArray(fields)) {
      logger.warn(
        `Invalid fields type of ${typeof fields} passed to ${componentName}. fields must be of type array.`
      );
      return [];
    }

    if (isRadioFieldComponent) {
      return getSanitizedRadioFields(fields, componentName);
    }

    return getSanitizedTextFields(fields, componentName);
  }, [componentName, fields, isRadioFieldComponent]);

  const runValidation = useCallback(
    (field: TextFieldOptionsType, value: string | undefined) => {
      const validationErrors = [];
      if (field.required && !value) {
        validationErrors.push(getRequiredFieldText());
      }
      if (field.type == 'email') {
        logger.warn('validating email ', value);
        validationErrors.push(isValidEmail(value) ? '' : getInvalidEmailText());
      }
      setFormValidationErrors({
        [field.name]: validationErrors,
      });
    },
    []
  );

  const fieldsWithHandlers = sanitizedFields.map((field) => {
    if (isRadioFieldOptions(field)) {
      const onChange = (value: string) => {
        // call `onChange` passed as radio `field` option
        field.onChange?.(value);

        // set `name` as value of 'unverifiedAttr'
        setValues({ unverifiedAttr: value });
      };

      return { ...field, onChange };
    }

    const { name, label, labelHidden, ...rest } = field;

    const onBlur: TextFieldOnBlur = (event) => {
      // call `onBlur` passed as text `field` option
      field.onBlur?.(event);

      // call machine blur handler
      handleBlur({ name, value: values[name] });

      runValidation(field, values[name]);
    };

    const onChangeText: OnChangeText = (value) => {
      // call `onChangeText` passed as text `field` option
      field.onChangeText?.(value);

      // call machine change handler
      handleChange({ name, value });

      setValues({ ...values, [name]: value });
    };

    return {
      ...rest,
      label: labelHidden ? undefined : label,
      onBlur,
      onChangeText,
      name,
      value: values[name],
    };
  }) as FieldType[];

  const disableFormSubmit = isRadioFieldComponent
    ? !values.unverifiedAttr
    : fieldsWithHandlers.some(({ required, value }) => {
        if (!required) {
          return false;
        }

        if (value) {
          return false;
        }
        return true;
      });

  const handleFormSubmit = () => {
    const submitValue = isRadioFieldComponent
      ? values
      : fieldsWithHandlers.reduce((acc, { name, value = '', type }) => {
          /*
                For phone numbers pass the first 3 charactes from value as dialCode until we support a dialCode picker
            */
          return type === 'phone'
            ? {
                ...acc,
                country_code: value?.substring(0, 3),
                [name]: value?.substring(3, value.length),
              }
            : { ...acc, [name]: value };
        }, {});

    handleSubmit?.(submitValue);
  };

  return {
    fields: fieldsWithHandlers,
    disableFormSubmit,
    formValidationErrors: { ...formValidationErrors, ...validationErrors },
    handleFormSubmit,
  };
}
