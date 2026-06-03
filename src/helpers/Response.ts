export const successResponse = (res:any, data?:any, message?:string) => {
   return res.status(200).json({
      success: true,
      message:message,
      data:data
   });
}; 

export const errorResponse = (res:any, message?:string) => {
   return res.status(404).json({
      success: false,
      message:message,
   });
};