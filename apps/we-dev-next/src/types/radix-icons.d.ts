declare module "@radix-ui/react-icons" {
  import { ComponentProps, ForwardRefExoticComponent } from "react";

  export interface IconProps extends ComponentProps<"svg"> {
    size?: number;
  }

  export type Icon = ForwardRefExoticComponent<IconProps>;

  export const ArrowRightIcon: Icon;
}
