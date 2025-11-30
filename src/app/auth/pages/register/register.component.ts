import { Component, inject } from "@angular/core";
import { ThemeService } from "../../../share/services/theme.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: "app-register",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"]
})

export class RegisterComponent {

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  public themeService = inject(ThemeService);
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  public errorMessage: string = '';

  ngOnInit(): void {
  }

  constructor(private router: Router) {
  }

  public myForm: FormGroup = this.formbuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.myForm.valid) {
      const { name, lastName, userName, email, password } = this.myForm.value;
      this.errorMessage = '';
      
      this.authService.register({ name, lastName, userName, email, password }).subscribe({
        next: () => this.router.navigate(['/projects']),
        error: (err) => {
          this.errorMessage = 'Error en el registro: ' + (err.error?.message || err.statusText);
        }
      });
    }
  }
}