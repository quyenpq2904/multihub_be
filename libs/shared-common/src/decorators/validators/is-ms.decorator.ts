import { registerDecorator, type ValidationOptions } from 'class-validator';
import ms = require('ms');

export function IsMs(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'isMs',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return (
            typeof value === 'string' &&
            value.length != 0 &&
            ms(value as any) !== undefined
          );
        },
        defaultMessage() {
          return `$property must be a valid ms format`;
        },
      },
    });
  };
}
