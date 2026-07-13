import mongoose from 'mongoose';
const schema=new mongoose.Schema({booking:{type:mongoose.Schema.Types.ObjectId,ref:'Booking',required:true},reviewer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},reviewed:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},rating:{type:Number,min:1,max:5,required:true},comment:{type:String,trim:true,minlength:3,maxlength:500,required:true}},{timestamps:true});
schema.index({booking:1,reviewer:1},{unique:true});
export default mongoose.models.Review||mongoose.model('Review',schema);
