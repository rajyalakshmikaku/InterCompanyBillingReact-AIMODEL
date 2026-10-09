import * as Yup from "yup";

export const LoginSchem= Yup.object().shape({
    
   username: Yup.string().required("Username or Email is required!"),
    password: Yup.string().required("Password is required!")
})
