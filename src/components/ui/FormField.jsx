import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Icon from './Icon';

/**
 * Formik-friendly field wrapping MUI TextField. Handles text, select, textarea
 * and password (with show/hide toggle) so pages stop hand-rolling inputs.
 *
 * <FormField name="email" label="Email" formik={formik} required />
 * <FormField name="role" label="Role" type="select" options={roles} formik={formik}
 *   getOptionValue={r => r.id} getOptionLabel={r => r.roleName} placeholder="Select Role" />
 */
const FormField = ({
  name,
  label,
  type = 'text',
  formik,
  required = false,
  options = [],
  getOptionValue = (o) => o.value,
  getOptionLabel = (o) => o.label,
  placeholder,
  fullWidth = true,
  size = 'small',
  ...rest
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isSelect = type === 'select';
  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';

  const touched = formik?.touched?.[name];
  const error = formik?.errors?.[name];
  const showError = Boolean(touched && error);

  const passwordAdornment = isPassword
    ? {
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} />
            </IconButton>
          </InputAdornment>
        ),
      }
    : {};

  return (
    <TextField
      name={name}
      label={
        label ? (
          <span>
            {label}
            {required && <span style={{ color: '#e0414a', marginLeft: 2 }}>*</span>}
          </span>
        ) : undefined
      }
      type={isPassword ? (showPassword ? 'text' : 'password') : isTextarea ? undefined : type}
      select={isSelect}
      multiline={isTextarea}
      minRows={isTextarea ? 2 : undefined}
      placeholder={placeholder}
      value={formik?.values?.[name] ?? ''}
      onChange={formik?.handleChange}
      onBlur={formik?.handleBlur}
      error={showError}
      helperText={showError ? error : undefined}
      fullWidth={fullWidth}
      size={size}
      InputProps={passwordAdornment}
      sx={{
        // Keep fields compact and prevent the empty-helper line from adding height.
        '& .MuiFormHelperText-root': {
          mt: 0.25,
          mb: 0,
          fontSize: '0.7rem',
          lineHeight: 1.3,
        },
      }}
      {...rest}
    >
      {isSelect && [
        <MenuItem key="__placeholder" value="">
          {placeholder || `Select ${label}`}
        </MenuItem>,
        ...options.map((opt) => (
          <MenuItem key={getOptionValue(opt)} value={getOptionValue(opt)}>
            {getOptionLabel(opt)}
          </MenuItem>
        )),
      ]}
    </TextField>
  );
};

export default FormField;
