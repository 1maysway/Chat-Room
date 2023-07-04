import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDebounce } from "../hooks";
import { CircularProgress, InputAdornment, TextField } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

type TextFieldWithCheckProps = {
  initialValue?: string | null;
  delay?: number;
  checker: (newValue: string) => any;
  name?: string;
  validate?: (newValue: string) => any;
  onStatusChange?: Dispatch<SetStateAction<TextFieldWithCheckStatus>>;
  status?: TextFieldWithCheckStatus;
  disabled?: boolean;
  value?:string|null;
  onChange?:Dispatch<SetStateAction<string|null>>;
  currentValue:string;
  statusHelperTexts?:StatusHelperText[];
};

export type TextFieldWithCheckStatus = "error" | "loading" | "default"|"success";

export type StatusHelperText={
  status:TextFieldWithCheckStatus;
  helperText:React.ReactNode;
}

const TextFieldWithCheck: React.FC<TextFieldWithCheckProps> = ({
  initialValue,
  delay = 500,
  checker,
  name,
  validate,
  onStatusChange,
  status: statusValue,
  disabled = false,
  value:valueValue,
  onChange,
  currentValue,
  statusHelperTexts
}) => {
  // const [firstValue,setFirstValue]=useState<string|null>(null);
  const [value, setValuee] = useState<string|null>(valueValue!==undefined ? (valueValue||""):(initialValue||null));
  const [status, setStatuss] = useState<TextFieldWithCheckStatus>(
    statusValue || "default"
  );
  const [prevStatus,setPrevStatus]=useState<TextFieldWithCheckStatus>("default");

  const setValue = (val:SetStateAction<string|null>)=>{
    // const v = typeof val === "function" ?val(value):val;
    onChange&&onChange(val)
    setValuee(val);
  }

  const setStatus = (val:SetStateAction<TextFieldWithCheckStatus>)=>{
    setPrevStatus(status);
    onStatusChange&&onStatusChange(val)
    setStatuss(val);
  }

  useEffect(()=>{
    setValuee(valueValue||value);
  },[valueValue]);

  useEffect(()=>{
    setStatuss(statusValue||status);
  },[statusValue]);

  useEffect(()=>{
    if(currentValue===value){
      setStatus("default");
    }
  },[currentValue])

  // useEffect(()=>{
  //   if(value && !firstValue){
  //     setFirstValue(value);
  //   }
  // },[valueValue]);

  const debouncedValue = useDebounce(value, delay);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tvalue = event.target.value;
    
    setValue(tvalue || null);

    const isValid = validate ? validate(tvalue) : true;

    if (
      tvalue &&
      tvalue !== debouncedValue &&
      tvalue !== currentValue &&
      isValid
    ) {
      setStatus("loading");
    } else if(tvalue === debouncedValue && isValid){      
      setStatus(prevStatus);
    }
    else {
      setStatus((prev) => (!isValid ? "error" : "default"));
    }
  };

  useEffect(() => {
    if (
      debouncedValue &&
      status === "loading" &&
      debouncedValue !== currentValue
    ) {
      checker(debouncedValue).then((res: boolean) => {
        setStatus((prev) => (!res ? "error" : "success"));
      });
    } else {
      setStatus(status==="error"?"error":"default");
    }
  }, [debouncedValue]);

  const helperTextColor=[["error","red"],["success","green"]].find(([s])=>s===status)?.at(1);
  const helperText=statusHelperTexts?.find(sht=>sht.status===status)?.helperText;

  return (
    <TextField
      type="text"
      variant="outlined"
      fullWidth
      name={name}
      value={value || ""}
      onChange={changeHandler}
      color={
        status === "success"
          ? "success"
          : "primary"
      }
      disabled={disabled}
      error={status === "error"}
      label={name && name[0].toUpperCase() + name.slice(1)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {status === "loading" ? (
              <CircularProgress size={20} />
            ) : (
              <CheckIcon
                fontSize="small"
                sx={{
                  opacity:
                    value === currentValue || status === "error" || !value
                      ? 0
                      : 1,
                }}
              />
            )}
          </InputAdornment>
        )
      }}
      helperText={helperText}
      FormHelperTextProps={{
        sx:{
          color:helperTextColor
        }
      }}
    />
  );
};

export default TextFieldWithCheck;
