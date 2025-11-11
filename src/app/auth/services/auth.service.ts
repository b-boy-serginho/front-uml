import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable, tap } from "rxjs";
import { ResponseLogin, ResponseRegister, User } from "../interfaces/auth.interface";




@Injectable({
    providedIn: "root"
})

export class AuthService {


   url = environment.apiUrl + '/api';


    constructor(
        private http: HttpClient
    ) { }


     login (email: string, password: string): Observable<ResponseLogin > {
        const body = { email, password };
        return this.http.post<ResponseLogin>(`${this.url}/auth/login`, body)
            .pipe(
                tap(response => {
                    console.log('Login response:', response);
                    this.saveToken(response.token,response.id!);
                    
                })
            );
    }


    saveToken(token: string, userId: string): void {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', userId);
    }
    saveUserId(userId: string): void {

        localStorage.setItem('user_id', userId);
    }
    register(user :User): Observable<ResponseRegister> {
        return this.http.post<ResponseRegister>(`${this.url}/auth/register`, user);
    }

    logout(): void {
        delete localStorage['auth_token'];
        
    }
}