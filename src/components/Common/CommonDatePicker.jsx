import React from 'react';
import { TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import "./CommenDatePicker.css";
// import { style } from '@mui/system';
// import "./CommenDatePicker.css";
import { style } from '@mui/system';
dayjs.locale('en-gb');

// function CommonDatePicker({ value, onChange ,placeholder = ''}) {
//   debugger
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
//     <DatePicker
//   value={value ? dayjs(value) : null}
//   onChange={(newValue) => onChange(newValue)}
//   format = {placeholder}
//   slotProps={{
//     textField: {
//       inputProps: { placeholder },
//       size: "small",
//       sx: {
//         width: "230px",

//         "& .MuiOutlinedInput-root": {
//           height: "38px",

//           /* NORMAL */
//           "& fieldset": {
//             borderColor: "#3D8C4F",
//           },

//           /* HOVER */
//           "&:hover fieldset": {
//             borderColor: "#3D8C4F",
//           },

//           /* ✅ FOCUS FIX (MOST IMPORTANT) */
//           "&.Mui-focused fieldset": {
//             borderColor: "#3D8C4F",
//             borderWidth: "1px",
//           },
//         },

//         "& input": {
//           padding: "6px 10px",
//           fontSize: "14px",
//         },
//       },
//     },
//   }}
// />

//     </LocalizationProvider>
//   );
// }
function CommonDatePicker({ value, onChange, label = "Select date", placeholder = "", maxDate }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={(newValue) => onChange(newValue)}
        format="DD/MM/YYYY"
        maxDate={maxDate === undefined ? dayjs() : maxDate}
        slotProps={{
          textField: {
            size: "small",
            label,
            placeholder, 
           sx: {
              width: "230px",            
              "& .MuiInputBase-root": {
                height: "38px",          
                fontSize: "14px",
              },
              "& input": {
                padding: "6px 10px",     
              },
              "& fieldset": {
                borderColor: "#3D8C4F",
              },
              "&:hover fieldset": {
                borderColor: "#3D8C4F",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3D8C4F",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}




export default CommonDatePicker;





