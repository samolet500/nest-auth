import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type ObjectWithPassword = { password: string };

@ValidatorConstraint({ name: 'IsPasswordsMatching', async: false })
export class IsPasswordsMatchingConstraint implements ValidatorConstraintInterface {
  public validate(passwordRepeat: string, args: ValidationArguments) {
    const obj = args.object as ObjectWithPassword;
    return obj.password === passwordRepeat;
  }

  public defaultMessage() {
    return 'Пароли не совпадают';
  }
}
