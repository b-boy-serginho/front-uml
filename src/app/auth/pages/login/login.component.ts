import { Component, inject } from "@angular/core";
import { ThemeService } from "../../../share/services/theme.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: "app-login",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]

})
export class LoginComponent {
  showPassword: boolean = false;
  public themeService = inject(ThemeService);
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  public errorMessage: string = '';
  ngOnInit(): void {
  }
  constructor(private router: Router) {}
  public myForm: FormGroup = this.formbuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  })
  togglePassword() {
    this.showPassword = !this.showPassword
  }
  login() {
    const { email, password } = this.myForm.value;
    this.authService.login(email, password).subscribe(
      {
        next: () => this.router.navigate(['/diagrama']),
        error: (err) => {
          this.errorMessage = 'Error de autenticación: ' + (err.error?.message || err.statusText);
        }
      });
  }
}