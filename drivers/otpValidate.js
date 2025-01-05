const otpExpiry=async(otpTime)=>{
  try {
    const currentDateTime=new Date();
    var differenceValue=(otpTime -currentDateTime.getTime())/1000;
    differenceValue/= 60 ;

    console.log('Expiry Time in minutes'+Math.abs(differenceValue));

    if(Math.abs(differenceValue)> 1 ){
        return true;  // time is 1 minute
    }
    return false;

  } catch (error) {
    console.log(error);
  }
}

module.exports={
    otpExpiry
}