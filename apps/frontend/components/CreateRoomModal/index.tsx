"use client";
import React from "react";
import Modal from "../common/Modal";
import Header from "../common/Modal/Header";
import { Formik, Form, FormikHelpers, Field, ErrorMessage } from "formik";
import { Users, Scale, MessageCircle, Loader2 } from "lucide-react";
import { InitialValues, CreateRoomModalProps } from "@/types/roomCreateModal";
import { roomCreateSchema } from "@/schemas";
import { useAppDispatch } from "@/libs/hooks";
import { closeCreateRoomModal } from "@/libs/features/modal/modalSlice";
import { toast } from "react-hot-toast";
import FieldContainer from "../ui/FieldContainer";
import SelectField from "../ui/SelectField";
import Button from "@/components/ui/Button";
import {
  inputClass,
  textareaClass,
  errorClass,
  labelClass,
} from "../ui/formStyles";
import { useCreateRoomMutation } from "@/libs/features/room/roomApiSlice";

const roomTypes = [
  {
    value: "open",
    label: "Open conversation",
    Icon: MessageCircle,
  },
  {
    value: "debate",
    label: "Debate",
    Icon: Scale,
  },
] as const;

const languages = ["English", "Spanish", "French", "German", "Japanese", "Korean", "Chinese"];
const levels = ["Beginner", "Intermediate", "Advanced", "Native"];

export default function CreateRoomModal({ isOpen }: CreateRoomModalProps) {
  const [createRoom] = useCreateRoomMutation();
  const dispatch = useAppDispatch();

  const onCloseHandler = () => {
    dispatch(closeCreateRoomModal());
  };

  const initialValues: InitialValues = {
    title: "",
    description: "",
    language: "English",
    level: "Beginner",
    maxParticipants: 2,
    type: "open",
  };

  const doSubmit = async (
    values: InitialValues,
    { setSubmitting }: FormikHelpers<InitialValues>
  ) => {
    try {
      const requestBody = {
        title: values.title,
        description: values.description,
        language: values.language,
        level: values.level,
        maxParticipants: values.maxParticipants,
        type: values.type,
      };

      await createRoom(requestBody).unwrap();

      onCloseHandler();
      toast.success("Room created successfully!");
      setSubmitting(false);
    } catch (error) {
      console.error("Room creation failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal size="md" onClose={onCloseHandler} labelledBy="modal-title">
      <Header
        onClose={onCloseHandler}
        title="Create a room"
        description="Set up a space for learners to practice together."
      />
      <Formik
        initialValues={initialValues}
        onSubmit={doSubmit}
        validationSchema={roomCreateSchema}
      >
        {({ isSubmitting, values }) => {
          const isDebate = values.type === "debate";

          return (
            <Form>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
                <fieldset>
                  <legend className={labelClass}>Room type</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roomTypes.map(({ value, label, Icon }) => (
                      <label key={value} className="relative block cursor-pointer">
                        <Field
                          type="radio"
                          name="type"
                          value={value}
                          className="peer sr-only"
                        />
                        <span className="flex h-full items-start gap-3 rounded-lg border border-white/[0.08] bg-[#161616] p-3.5 transition-colors duration-150 hover:border-white/[0.16] peer-checked:border-green-500/50 peer-checked:bg-green-500/[0.05] peer-checked:[&_svg]:text-green-400 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green-500/60 motion-reduce:transition-none">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-white">
                              {label}
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <ErrorMessage name="type" component="p" className={errorClass} />
                </fieldset>

                <FieldContainer
                  label={isDebate ? "Debate topic" : "Topic"}
                  name="title"
                  hint={
                    isDebate
                      ? "Phrase it as a statement people can argue for or against."
                      : undefined
                  }
                >
                  <Field
                    id="title"
                    type="text"
                    name="title"
                    className={inputClass}
                    placeholder={
                      isDebate
                        ? "e.g., Remote work is better than office work"
                        : "e.g., English conversation practice"
                    }
                  />
                  <ErrorMessage name="title" component="p" className={errorClass} />
                </FieldContainer>

                <FieldContainer
                  label={isDebate ? "Context" : "Description"}
                  name="description"
                >
                  <Field
                    id="description"
                    name="description"
                    as="textarea"
                    rows={3}
                    className={textareaClass}
                    placeholder={
                      isDebate
                        ? "Add background or ground rules for the debate..."
                        : "Describe what participants can expect in this room..."
                    }
                  />
                  <ErrorMessage name="description" component="p" className={errorClass} />
                </FieldContainer>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FieldContainer label="Language" name="language">
                    <SelectField name="language">
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </SelectField>
                    <ErrorMessage name="language" component="p" className={errorClass} />
                  </FieldContainer>

                  <FieldContainer label="Level" name="level">
                    <SelectField name="level">
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </SelectField>
                    <ErrorMessage name="level" component="p" className={errorClass} />
                  </FieldContainer>

                  <FieldContainer label="Max participants" name="maxParticipants">
                    <div className="relative">
                      <Users
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                        aria-hidden="true"
                      />
                      <Field
                        id="maxParticipants"
                        type="number"
                        name="maxParticipants"
                        min={2}
                        max={12}
                        className={`${inputClass} pl-9 tabular-nums`}
                      />
                    </div>
                    <ErrorMessage
                      name="maxParticipants"
                      component="p"
                      className={errorClass}
                    />
                  </FieldContainer>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  isDisabled={isSubmitting}
                  onHandler={onCloseHandler}
                >
                  Cancel
                </Button>
                <Button type="submit" isDisabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  )}
                  {isSubmitting ? "Creating…" : "Create room"}
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
}