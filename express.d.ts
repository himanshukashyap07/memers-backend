// this file is used to use req.user in express with typescript
import { IUser } from "./src/models/User.model.js"; 

declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
    }
  }
}