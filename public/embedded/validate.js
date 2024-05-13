const { text } = require("express");

const form=document.querySelector('form')

form.addEventListener('submit',event=>{
    const name=document.querySelector("[name='FormField[2][4]']").value.trim();
    const email=document.querySelector("[name='FormField[1][1]']").value.trim();
    const password=document.querySelector("[name='FormField[1][2]']").value.trim();
    const confirmPassword=document.querySelector("[name='FormField[1][3]']").value.trim();
    const phone=document.querySelector("[name='FormField[2][7]']").value.trim();

    const errors=[];

    if(name==='')
        errors.push("Username can't be blank")
    if(email==='')
        errors.push("email can't be blank")
    if(password==='')
        errors.push("Password can't be blank")
    if(password !== confirmPassword)
        errors.push("Passwords must match")
    if(phone==='')
        errors.push("phone number can't be blank")
   // console.log(errors);
   if(errors.length >0){
    for(let i=0;i<errors.length;i++){
        Toastify({
            text:errors[i],
            duration:4000,
            gravity:"top",
            position:"center",
            style:{
                background:"#DF1C24"
            }
        }).showToast();
    }
   }else{
    Toastify({
        text:"Success",
        duration:4000,
        gravity:"top",
        position:"center",
        style:{
            background:"#4babe"
        }
    }).showToast();
   }
})