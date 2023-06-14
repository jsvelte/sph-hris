import moment from 'moment'
import classNames from 'classnames'
import toast from 'react-hot-toast'
import ReactSelect from 'react-select'
import { useRouter } from 'next/router'
import { Tab } from '@headlessui/react'
import makeAnimated from 'react-select/animated'
import CreatableSelect from 'react-select/creatable'
import { yupResolver } from '@hookform/resolvers/yup'
import React, { FC, useEffect, useState } from 'react'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { X, Save, User, Coffee, FileText, Calendar, RefreshCcw } from 'react-feather'

import TextField from './../TextField'
import useProject from '~/hooks/useProject'
import Input from '~/components/atoms/Input'
import useUserQuery from '~/hooks/useUserQuery'
import { Roles } from '~/utils/constants/roles'
import SpinnerIcon from '~/utils/icons/SpinnerIcon'
import { NewLeaveSchema } from '~/utils/validation'
import { User as UserType } from '~/utils/types/userTypes'
import Button from '~/components/atoms/Buttons/ButtonAction'
import { customStyles } from '~/utils/customReactSelectStyles'
import ModalFooter from '~/components/templates/ModalTemplate/ModalFooter'
import { NewLeaveFormValues, ReactSelectOption } from '~/utils/types/formValues'
import {
  generateUserSelect,
  generateProjectsMultiSelect,
  generateLeaveTypeSelect,
  generateNumberOfDaysSelect
} from '~/utils/createLeaveHelpers'
import useLeave from '~/hooks/useLeave'
import { LeaveProject, LeaveType } from '~/utils/types/leaveTypes'
import { LeaderDetails, ProjectDetails } from '~/utils/types/projectTypes'
import { numberOfDaysInLeaves } from '~/utils/constants/dummyAddNewLeaveFields'

type Props = {
  isOpen: boolean
  closeModal: () => void
}

const animatedComponents = makeAnimated()

const EditTab: FC<Props> = ({ isOpen, closeModal }): JSX.Element => {
  const router = useRouter()
  const { leaveId } = router.query
  const [managers, setManagers] = useState<UserType[]>([])
  const [leaders, setLeaders] = useState<LeaderDetails[]>([])
  const { handleProjectQuery, getLeadersQuery } = useProject()
  const { handleAllUsersQuery, handleUserQuery } = useUserQuery()
  const { handleLeaveTypeQuery, getSpecificLeaveQuery, handleUpdateLeaveMutation } = useLeave()
  const { data: user } = handleUserQuery()
  const leaveMutation = handleUpdateLeaveMutation(
    user?.userById.id as number,
    parseInt(router.query.year as string)
  )
  const { data: projects } = handleProjectQuery()
  const { data: leaveTypes } = handleLeaveTypeQuery()
  const { data: leadersList } = getLeadersQuery(undefined)
  const { data: userLeave } = getSpecificLeaveQuery(Number(leaveId))
  const { data: users, isSuccess: isUsersSuccess } = handleAllUsersQuery()

  // Initial Data useStates
  const [initialProjectNameValue, setInitialProjectNameValue] = useState<ReactSelectOption[]>([])

  const [initialProjectLeaderValue, setInitialProjectLeaderValue] = useState<ReactSelectOption[]>(
    []
  )
  const [initialLeaveTypeValue, setInitialLeaveTypeValue] = useState<ReactSelectOption | null>(null)
  const [initialLeaveDateValue, setInitialLeaveDateValue] = useState<
    Array<{ date: string; number_of_days_in_leave: ReactSelectOption; is_with_pay: boolean }>
  >([])
  const [initialManagerValue, setInitialManagerValue] = useState<ReactSelectOption | null>(null)
  const [initialReasonValue, setInitialReasonValue] = useState<ReactSelectOption | null>(null)

  const emptyReactSelectOption = {
    label: '',
    value: ''
  }
  const paidLeaves = user?.userById.paidLeaves

  const hasRemainingPaidLeaves = paidLeaves !== undefined ? paidLeaves <= 0 : false

  const [isSaveDisable, setIsSaveDisable] = useState<boolean>(true)

  const handleDataChange = (): void => {
    setIsSaveDisable(false)
  }

  // modify custom style control
  customStyles.control = (provided: Record<string, unknown>, state: any): any => ({
    ...provided,
    boxShadow: 'none',
    borderColor: 'none',
    '&:hover': {
      color: '#75c55e'
    }
  })

  const {
    reset,
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<NewLeaveFormValues>({
    mode: 'onTouched',
    resolver: yupResolver(NewLeaveSchema)
  })

  // This will handle form submit and save
  const handleSave = async (data: NewLeaveFormValues): Promise<void> => {
    return await new Promise((resolve) => {
      // Other Project Name
      const others = data.projects.map(
        (project) => project.project_name.__isNew__ === true && project.project_name.value
      )

      leaveMutation.mutate(
        {
          userId: user?.userById.id as number,
          leaveTypeId: parseInt(data.leave_type.value),
          leaveId: Number(leaveId),
          managerId: parseInt(data.manager.value),
          reason: data.reason,
          otherProject: others.filter((value) => value !== false).toString(),
          leaveDates: data.leave_date.map((date) => {
            return {
              leaveDate: date.date,
              isWithPay: date.is_with_pay,
              days: parseFloat(date.number_of_days_in_leave.value)
            }
          }),
          leaveProjects: data.projects.map((project) => {
            const otherProjectType = projects?.projects.find(
              (project) => project.name.toLowerCase() === 'others'
            ) as ProjectDetails

            return {
              projectId: (project.project_name.__isNew__ as boolean)
                ? otherProjectType.id
                : parseInt(project.project_name.value),
              projectLeaderId: parseInt(project.project_leader.value)
            }
          })
        },
        {
          onSuccess: ({ updateLeave }) => {
            // Reset state variables before making a new query
            closeModal()
            toast.success(updateLeave)
          }
        }
      )

      resolve()
    })
  }

  const { fields: leaveDateFields } = useFieldArray({
    control,
    name: 'leave_date'
  })

  const { fields: projectFields, update: updateProject } = useFieldArray({
    control,
    name: 'projects'
  })

  const handleInitialValues = (): void => {
    handleAddNewProject(initialProjectNameValue, initialProjectLeaderValue)
    setValue('leave_type', initialLeaveTypeValue ?? emptyReactSelectOption)
    setValue('leave_date', initialLeaveDateValue ?? '')
    setValue('manager', initialManagerValue ?? emptyReactSelectOption)
    setValue('reason', initialReasonValue?.label as string)
  }

  // Add Project
  const handleAddNewProject = (
    projectData: ReactSelectOption[],
    projectLeaderData: ReactSelectOption[]
  ): void => {
    const newProjectFields = projectData.map((projectName, index) => ({
      project_name: projectName,
      project_leader: projectLeaderData[index]
    }))

    newProjectFields.forEach((field, index) => {
      updateProject(parseInt(index.toString()), field)
    })
  }

  const handleReset = (): void => {
    reset({
      projects: [
        {
          project_name: emptyReactSelectOption,
          project_leader: emptyReactSelectOption
        }
      ],
      leave_type: emptyReactSelectOption,
      leave_date: [
        {
          date: '',
          number_of_days_in_leave: emptyReactSelectOption,
          is_with_pay: false
        }
      ],
      manager: emptyReactSelectOption,
      reason: ''
    })
  }

  useEffect(() => {
    if (
      initialProjectNameValue.length !== 0 &&
      initialProjectLeaderValue.length !== 0 &&
      initialLeaveTypeValue !== null &&
      initialLeaveDateValue.length > 0 &&
      initialManagerValue !== null &&
      initialReasonValue !== null
    ) {
      handleInitialValues()
    }
  }, [
    initialProjectNameValue,
    initialProjectLeaderValue,
    initialLeaveTypeValue,
    initialLeaveDateValue,
    initialManagerValue,
    initialReasonValue
  ])

  useEffect(() => {
    if (userLeave?.userLeave !== undefined && userLeave.userLeave.length > 0) {
      const {
        leaveProjects,
        leaveType,
        leaveTypeId,
        leaveDate,
        days,
        isWithPay,
        managerId,
        manager,
        reason
      }: {
        leaveProjects: LeaveProject[]
        leaveType: string
        leaveTypeId: number
        leaveDate: string
        days: number
        isWithPay: boolean
        managerId: number
        manager: string
        reason: string
      } = userLeave.userLeave[0]

      setInitialProjectNameValue(
        leaveProjects?.map((leaveProject) => ({
          value: String(leaveProject.projectId),
          label: leaveProject.project.name
        })) as ReactSelectOption[]
      )

      setInitialProjectLeaderValue(
        leaveProjects?.map((leaveProject) => ({
          value: String(leaveProject.projectLeaderId),
          label: leaveProject.projectLeader.name
        })) as ReactSelectOption[]
      )

      const leaveTypeValue: ReactSelectOption = {
        label: String(leaveType),
        value: String(leaveTypeId)
      }
      setInitialLeaveTypeValue(leaveTypeValue)

      const leaveDateValue = [
        {
          date: moment(String(leaveDate)).format('YYYY-MM-DD'),
          number_of_days_in_leave: generateNumberOfDaysSelect(numberOfDaysInLeaves).filter(
            (x) => parseFloat(x.value).toFixed(4) === days.toFixed(4)
          )[0],
          is_with_pay: isWithPay
        }
      ]
      setInitialLeaveDateValue(leaveDateValue)

      const managerValue: ReactSelectOption = {
        label: String(manager),
        value: String(managerId)
      }
      setInitialManagerValue(managerValue)

      const reasonValue: ReactSelectOption = {
        label: reason,
        value: String(reason)
      }
      setInitialReasonValue(reasonValue)
    }
  }, [userLeave?.userLeave[0], leaveId])

  useEffect(() => {
    if (leadersList !== undefined) setLeaders(leadersList.allLeaders)
  }, [leadersList])

  useEffect(() => {
    if (isUsersSuccess) {
      const tempManager = users.allUsers.filter((user) => user.role.name === Roles.MANAGER)
      setManagers([...tempManager])
    }
  }, [isUsersSuccess])

  useEffect(() => {
    if (isOpen) {
      handleInitialValues()
    }
  }, [isOpen])

  return (
    <Tab.Panel className="focus:outline-none">
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(handleSave)}
      >
        <main className="grid grid-cols-2 gap-x-4 gap-y-6 py-6 px-8 text-xs text-slate-800">
          {/* Projects */}
          {projectFields.map((field, index) => (
            <div
              key={field.id}
              className={classNames(
                'col-span-2 flex w-full flex-wrap items-end justify-between',
                ' space-y-4 sm:space-x-2 md:space-y-0',
                (errors?.projects?.[index]?.project_name !== null &&
                  errors?.projects?.[index]?.project_name !== undefined) ||
                  (errors?.projects?.[index]?.project_leader !== null &&
                    errors?.projects?.[index]?.project_leader !== undefined)
                  ? 'pb-4'
                  : ''
              )}
            >
              {/* Project */}
              <section className="w-full sm:w-[43%]">
                <TextField title={`Project`} Icon={Coffee} isRequired>
                  <Controller
                    name={`projects.${index}.project_name` as any}
                    control={control}
                    render={({ field }) => {
                      const handleDataChange = (selectedOption: any): void => {
                        field.onChange(selectedOption)
                        setIsSaveDisable(false)
                      }

                      return (
                        <CreatableSelect
                          {...field}
                          isClearable
                          placeholder=""
                          styles={customStyles}
                          closeMenuOnSelect={true}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? 'border-primary'
                                : errors.projects?.[index]?.project_name !== null &&
                                  errors.projects?.[index]?.project_name !== undefined
                                ? 'border-rose-500 ring-rose-500'
                                : 'border-slate-300'
                          }}
                          isDisabled={isSubmitting}
                          onChange={handleDataChange}
                          backspaceRemovesValue={true}
                          components={animatedComponents}
                          options={generateProjectsMultiSelect(
                            projects?.projects as ProjectDetails[]
                          )}
                          className="w-full"
                        />
                      )
                    }}
                  />
                </TextField>
                {errors.projects?.[index]?.project_name !== null &&
                  errors.projects?.[index]?.project_name !== undefined && (
                    <span className="error absolute text-[10px]">
                      Project {index + 1} name is required
                    </span>
                  )}
              </section>

              {/* Project Leader */}
              <section className="w-full flex-1">
                <TextField title="Project Leader" Icon={Coffee} isRequired>
                  <Controller
                    name={`projects.${index}.project_leader` as any}
                    control={control}
                    render={({ field }) => {
                      const handleDataChange = (selectedOption: any): void => {
                        field.onChange(selectedOption)
                        setIsSaveDisable(false)
                      }

                      return (
                        <ReactSelect
                          {...field}
                          isClearable
                          placeholder=""
                          styles={customStyles}
                          closeMenuOnSelect={true}
                          isDisabled={isSubmitting}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? 'border-primary'
                                : errors.projects?.[index]?.project_leader !== null &&
                                  errors.projects?.[index]?.project_leader !== undefined
                                ? 'border-rose-500 ring-rose-500'
                                : 'border-slate-300'
                          }}
                          backspaceRemovesValue={true}
                          options={generateUserSelect(leaders as UserType[])}
                          components={animatedComponents}
                          className="w-full"
                          onChange={handleDataChange}
                        />
                      )
                    }}
                  />
                </TextField>
                {errors.projects?.[index]?.project_leader !== null &&
                  errors.projects?.[index]?.project_leader !== undefined && (
                    <span className="error absolute text-[10px]">
                      Project leader {index + 1} is required
                    </span>
                  )}
              </section>
            </div>
          ))}

          {/* Leave Type */}
          <section className="col-span-2">
            <TextField title="Leave Type" Icon={User} isRequired className="py-2.5 text-xs">
              <Controller
                name="leave_type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const handleDataChange = (selectedOption: any): void => {
                    field.onChange(selectedOption)
                    setIsSaveDisable(false)
                  }

                  return (
                    <ReactSelect
                      {...field}
                      isClearable
                      placeholder=""
                      className="w-full"
                      styles={customStyles}
                      classNames={{
                        control: (state) =>
                          state.isFocused
                            ? 'border-primary'
                            : errors.leave_type !== null && errors.leave_type !== undefined
                            ? 'border-rose-500 ring-rose-500'
                            : 'border-slate-300'
                      }}
                      value={field.value}
                      onChange={handleDataChange}
                      isDisabled={isSubmitting}
                      options={generateLeaveTypeSelect(leaveTypes?.leaveTypes as LeaveType[])}
                    />
                  )
                }}
              />
            </TextField>
            {errors.leave_type !== null && errors.leave_type !== undefined && (
              <span className="error text-[10px]">Type of leave is required</span>
            )}
          </section>

          {/* Leave Dynamic Field */}
          {leaveDateFields.map((date, index) => (
            <div
              key={date.id}
              className={classNames(
                'col-span-2 flex w-full flex-wrap items-end justify-between',
                'space-y-4 sm:space-x-2 md:space-y-0',
                (errors?.leave_date?.[index]?.date !== null &&
                  errors?.leave_date?.[index]?.date !== undefined) ||
                  (errors?.leave_date?.[index]?.number_of_days_in_leave !== null &&
                    errors?.leave_date?.[index]?.number_of_days_in_leave !== undefined)
                  ? 'pb-4'
                  : ''
              )}
            >
              {/* Date Calendar Field */}
              <section className="w-full sm:w-[36%]">
                <TextField
                  title={`Leave Date`}
                  Icon={Calendar}
                  isRequired
                  isError={errors?.leave_date?.[index]?.date}
                  className="flex-1"
                >
                  <Input
                    type="date"
                    disabled={isSubmitting}
                    {...register(`leave_date.${index}.date` as any)}
                    placeholder="Leave Date"
                    iserror={
                      errors.leave_date?.[index]?.date !== null &&
                      errors.leave_date?.[index]?.date !== undefined
                    }
                    className="py-2.5 pl-11 text-xs"
                    onChange={handleDataChange}
                  />
                </TextField>
                {errors.leave_date?.[index]?.date !== null &&
                  errors.leave_date?.[index]?.date !== undefined && (
                    <span className="error absolute text-[10px]">Leave Date is required field</span>
                  )}
              </section>
              {/* Number of days in leave */}
              <section className="w-full flex-1">
                <TextField
                  title="Number of Days in Leave"
                  Icon={User}
                  isRequired
                  className="py-2.5 text-xs"
                >
                  <Controller
                    name={`leave_date.${index}.number_of_days_in_leave`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                      const handleDataChange = (selectedOption: any): void => {
                        field.onChange(selectedOption)
                        setIsSaveDisable(false)
                      }

                      return (
                        <ReactSelect
                          {...field}
                          isClearable
                          placeholder=""
                          className="w-full"
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? 'border-primary'
                                : errors.leave_date?.[index]?.number_of_days_in_leave !== null &&
                                  errors.leave_date?.[index]?.number_of_days_in_leave !== undefined
                                ? 'border-rose-500 ring-rose-500'
                                : 'border-slate-300'
                          }}
                          styles={customStyles}
                          value={field.value}
                          onChange={handleDataChange}
                          isDisabled={isSubmitting}
                          options={generateNumberOfDaysSelect(numberOfDaysInLeaves)}
                        />
                      )
                    }}
                  />
                </TextField>
                {errors.leave_date?.[index]?.number_of_days_in_leave !== null &&
                  errors.leave_date?.[index]?.number_of_days_in_leave !== undefined && (
                    <span className="error absolute text-[10px]">
                      Number of days in leave is required
                    </span>
                  )}
              </section>
              <div className="ml-4 flex items-center space-x-2 sm:ml-0">
                {/* With Pay boolean */}
                <div className="shrink-0">
                  <label className="flex h-10 items-center">
                    <input
                      disabled={hasRemainingPaidLeaves}
                      type="checkbox"
                      className={classNames(
                        `h-4 w-4 rounded border-slate-300 bg-slate-100 ${
                          hasRemainingPaidLeaves ? 'opacity-30' : ''
                        }`,
                        'text-primary focus:ring-primary'
                      )}
                      {...register(`leave_date.${index}.is_with_pay` as any)}
                      onChange={handleDataChange}
                    />
                    <span
                      className={`ml-2 select-none text-xs capitalize text-slate-500 ${
                        hasRemainingPaidLeaves ? 'opacity-30' : ''
                      }`}
                    >
                      With Pay
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Manager */}
          <section className="col-span-2">
            <TextField title="Manager" Icon={User} isRequired className="py-2.5 text-xs">
              <Controller
                name="manager"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const handleDataChange = (selectedOption: any): void => {
                    field.onChange(selectedOption)
                    setIsSaveDisable(false)
                  }

                  return (
                    <ReactSelect
                      {...field}
                      isClearable
                      placeholder=""
                      className="w-full"
                      styles={customStyles}
                      classNames={{
                        control: (state) =>
                          state.isFocused
                            ? 'border-primary'
                            : errors.manager !== null && errors.manager !== undefined
                            ? 'border-rose-500 ring-rose-500'
                            : 'border-slate-300'
                      }}
                      value={field.value}
                      onChange={handleDataChange}
                      isDisabled={isSubmitting}
                      options={generateUserSelect(managers)}
                    />
                  )
                }}
              />
            </TextField>
            {errors.manager !== null && errors.manager !== undefined && (
              <span className="error text-[10px]">Manager is required</span>
            )}
          </section>

          {/* Reason for leave Field */}
          <section className="col-span-2">
            <TextField title="Reason for leave" Icon={FileText} isRequired>
              <ReactTextareaAutosize
                id="reason"
                {...register('reason')}
                className={classNames(
                  'text-area-auto-resize pl-12',
                  errors?.reason !== null && errors.reason !== undefined
                    ? 'border-rose-500 ring-rose-500'
                    : ''
                )}
                disabled={isSubmitting}
                onChange={handleDataChange}
              />
            </TextField>
            {errors.reason !== null && errors.reason !== undefined && (
              <span className="error text-[10px]">{errors.reason?.message}</span>
            )}
          </section>
        </main>

        {/* Custom Modal Footer Style */}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-1 text-sm"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={closeModal}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-1 text-sm"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </Button>
          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting || isSaveDisable}
            className="flex items-center space-x-2 px-5 py-1 text-sm"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="h-3 w-3 fill-amber-600" />
                <span>Saving..</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Tab.Panel>
  )
}

EditTab.defaultProps = {}

export default EditTab