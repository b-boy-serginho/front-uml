export interface User {
   id?: string;
   name: string;
   lastName: string;
   userName: string;
   email: string;
   password: string;
}



export interface ResponseLogin{
      id: string,
     token : string
}


export interface ResponseRegister {

     user: User,
     roles : string[],
     token : string
}