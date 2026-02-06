export type UsePasscodeResult =
    | {
          isLoading: false;
          isSet: true;
          passcodeLength: number;
          set: (passcode: string) => Promise<void>;
          validate: (passcode: string) => Promise<boolean>;
          remove: () => Promise<void>;
          promptAndCheck: () => Promise<void>;
      }
    | {
          isLoading: false;
          isSet: false;
          passcodeLength?: undefined;
          set: (passcode: string) => Promise<void>;
          validate?: undefined;
          remove?: undefined;
          promptAndCheck?: undefined;
      }
    | {
          isLoading: true;
          isSet: false;
          passcodeLength?: undefined;
          set?: undefined;
          validate?: undefined;
          remove?: undefined;
          promptAndCheck?: undefined;
      };
