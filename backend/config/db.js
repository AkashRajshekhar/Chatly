import mongoose from "mongoose";

const connectToDb = async ()=>{ 
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("db connected sucessfully")
    } catch (error) {
        console.log("db error" , error)
    }
}

export default connectToDb;