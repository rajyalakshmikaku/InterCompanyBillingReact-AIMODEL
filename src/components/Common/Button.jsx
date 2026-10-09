import React from 'react'

const  Button = ({btnText,setShowCreateScreen}) => {
  return (
    <div>
      <button
    className="btn_role"
    style={{ backgroundColor: "darkorange", color: "white", border: "none" }}
    onClick={setShowCreateScreen}
  >
    {btnText}
  </button>
    </div>
  )
}

export default Button
