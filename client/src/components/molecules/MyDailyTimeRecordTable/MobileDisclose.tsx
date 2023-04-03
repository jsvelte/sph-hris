import moment from 'moment'
import Link from 'next/link'
import Tippy from '@tippyjs/react'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { HiFire } from 'react-icons/hi'
import React, { FC, useState } from 'react'
import { Table } from '@tanstack/react-table'
import { Disclosure, Menu } from '@headlessui/react'
import { Check, Calendar, RefreshCw, ThumbsDown, ChevronRight, MoreVertical } from 'react-feather'

import Chip from '~/components/atoms/Chip'
import useUserQuery from '~/hooks/useUserQuery'
import AddNewOffsetModal from './AddNewOffsetModal'
import FiledOffsetModal from './../FiledOffsetModal'
import Button from '~/components/atoms/Buttons/Button'
import AddNewOvertimeModal from '../AddNewOvertimeModal'
import { WorkStatus } from '~/utils/constants/work-status'
import { variants } from '~/utils/constants/animationVariants'
import { NO_OVERTIME } from '~/utils/constants/overtimeStatus'
import ChangeShiftRequestModal from './ChangeShiftRequestModal'
import { USER_POSITIONS } from '~/utils/constants/userPositions'
import { IEmployeeTimeEntry } from '~/utils/types/timeEntryTypes'
import MenuTransition from '~/components/templates/MenuTransition'
import LineSkeleton from '~/components/atoms/Skeletons/LineSkeleton'
import InterruptionTimeEntriesModal from '../InterruptionTimeEntriesModal'
import DisclosureTransition from '~/components/templates/DisclosureTransition'

type Props = {
  table: Table<IEmployeeTimeEntry>
  isLoading: boolean
  error: unknown
}

const MobileDisclose: FC<Props> = ({ table, isLoading, error }): JSX.Element => {
  const [isOpenTimeEntry, setIsOpenTimeEntry] = useState<boolean>(false)
  const [isOpenNewOffset, setIsOpenNewOffset] = useState<boolean>(false)
  const [isOpenNewOvertime, setIsOpenNewOvertime] = useState<boolean>(false)
  const [isOpenChangeShiftRequest, setIsOpenChangeShiftRequest] = useState<boolean>(false)
  const [isOpenFiledOffset, setIsOpenFiledOffset] = useState<boolean>(false)

  const [timeEntryId, setTimeEntryId] = useState<number>(-1)
  const { handleUserQuery } = useUserQuery()
  const { data: user } = handleUserQuery()

  const handleIsOpenTimeEntryToggle = (id?: string | undefined): void => {
    setIsOpenTimeEntry(!isOpenTimeEntry)
    setTimeEntryId(parseInt(id as string))
  }

  const handleIsOpenNewOffsetToggle = (): void => setIsOpenNewOffset(!isOpenNewOffset)
  const handleIsOpenChangeShiftRequestToggle = (): void =>
    setIsOpenChangeShiftRequest(!isOpenChangeShiftRequest)
  const handleIsOpenFiledOffsetToggle = (): void => setIsOpenFiledOffset(!isOpenFiledOffset)
  const handleIsOpenNewOvertime = (): void => setIsOpenNewOvertime(!isOpenNewOvertime)

  const EMPTY = 'N/A'

  const menuItemButton = 'px-3 py-2 text-left text-xs hover:text-slate-700 text-slate-500'

  return (
    <>
      {error === null ? (
        isLoading ? (
          <div className="flex flex-col px-4 py-3">
            {Array.from({ length: 30 }, (_, i) => (
              <LineSkeleton key={i} className="py-1" />
            ))}
          </div>
        ) : (
          <>
            {table.getPageCount() === 0 ? (
              <div className="h-[50vh]">
                <DiscloseMessage message="No Available Data" />
              </div>
            ) : (
              <>
                {table.getRowModel().rows.map((row) => {
                  const { original: timeEntry } = row
                  const { overtime } = timeEntry

                  const minuteDifference =
                    timeEntry.timeOut !== null
                      ? Math.floor(
                          moment
                            .duration(
                              moment(timeEntry.timeOut?.createdAt).diff(
                                `${moment(timeEntry.date).format('YYYY-MM-DD')} ${moment(
                                  '19:30',
                                  'HH:mm:ss'
                                ).format('HH:mm:ss')}`
                              )
                            )
                            .asMinutes()
                        )
                      : NO_OVERTIME

                  return (
                    <Disclosure key={row.id}>
                      {({ open }) => (
                        <motion.div
                          variants={variants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Disclosure.Button
                            className={classNames(
                              'w-full border-b border-slate-200 py-3 px-4 hover:bg-white',
                              open ? 'bg-white' : 'hover:shadow-md hover:shadow-slate-200',
                              timeEntry.status === WorkStatus.VACATION_LEAVE.toLowerCase()
                                ? 'bg-amber-50 hover:bg-amber-50'
                                : '',
                              timeEntry.status === WorkStatus.ABSENT.toLowerCase()
                                ? 'bg-fuchsia-50 hover:bg-fuchsia-50'
                                : ''
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-slate-600">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                  {moment(new Date(row.original.date)).format('MMMM DD, YYYY')}
                                </span>
                                <Chip label={row.original.status} />
                              </div>
                              <ChevronRight
                                className={classNames(
                                  'h-4 w-4 text-slate-600 duration-300',
                                  open ? 'rotate-90' : ''
                                )}
                              />
                            </div>
                          </Disclosure.Button>
                          <DisclosureTransition>
                            <Disclosure.Panel
                              className={classNames(
                                'text-slate-600',
                                open ? 'bg-white shadow-md' : ''
                              )}
                            >
                              <ul className="flex flex-col divide-y divide-slate-200">
                                <li className="flex items-center space-x-1 px-4 py-2">
                                  <p>Time In:</p>
                                  <div className="relative flex">
                                    {timeEntry.timeIn?.remarks !== undefined &&
                                    timeEntry.timeIn?.remarks !== '' ? (
                                      <>
                                        <Link
                                          href={`my-daily-time-record/?time_in=${timeEntry.timeIn?.id}`}
                                          className="relative flex cursor-pointer active:scale-95"
                                        >
                                          {/* Actual Time In Data */}
                                          <span className="font-semibold">
                                            {timeEntry.timeIn?.timeHour ?? EMPTY}
                                          </span>
                                          {/* Status */}
                                          {timeEntry.startTime > timeEntry.timeIn?.timeHour ? (
                                            <span
                                              className={classNames(
                                                'ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500'
                                              )}
                                            />
                                          ) : (
                                            <>
                                              {!Number.isNaN(timeEntry.timeIn?.id) && (
                                                <span
                                                  className={classNames(
                                                    'ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500'
                                                  )}
                                                />
                                              )}
                                            </>
                                          )}
                                        </Link>
                                      </>
                                    ) : (
                                      <>
                                        {/* Actual Time In Data */}
                                        <span className="font-semibold">
                                          {timeEntry.timeIn?.timeHour ?? EMPTY}
                                        </span>
                                        {/* Status */}
                                        {timeEntry.timeIn?.timeHour !== undefined &&
                                        timeEntry.timeIn?.timeHour !== ''
                                          ? !(timeEntry.startTime > timeEntry.timeIn?.timeHour) && (
                                              <span
                                                className={classNames(
                                                  'ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500'
                                                )}
                                              />
                                            )
                                          : ''}
                                      </>
                                    )}
                                  </div>
                                </li>
                                <li className="flex items-center space-x-2 px-4 py-2">
                                  <p>Time Out:</p>
                                  <div className="relative flex">
                                    {timeEntry.timeOut?.remarks !== undefined &&
                                    timeEntry.timeOut?.remarks !== '' ? (
                                      <Link
                                        href={`my-daily-time-record/?time_out=${timeEntry.timeOut?.id}`}
                                        className="relative flex cursor-pointer active:scale-95"
                                      >
                                        {/* Actual Time Out Data */}
                                        <span className="font-semibold">
                                          {timeEntry.timeOut?.timeHour ?? EMPTY}
                                        </span>
                                        {/* Status */}
                                        {!Number.isNaN(timeEntry.timeOut?.id) && (
                                          <span
                                            className={classNames(
                                              'ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500'
                                            )}
                                          />
                                        )}
                                      </Link>
                                    ) : (
                                      <span className="font-semibold">
                                        {timeEntry.timeOut?.timeHour ?? EMPTY}
                                      </span>
                                    )}
                                  </div>
                                </li>
                                <li className="px-4 py-2">
                                  Work Hours:{' '}
                                  <span className="font-semibold">{timeEntry.workedHours}</span>
                                </li>
                                <li className="px-4 py-2">
                                  Late(min): <span className="font-semibold">{timeEntry.late}</span>
                                </li>
                                <li className="px-4 py-2">
                                  Undertime(min):{' '}
                                  <span className="font-semibold">{timeEntry.undertime}</span>
                                </li>
                                <li className="flex flex-wrap items-center space-x-2 px-4 py-2">
                                  <span>Overtime(min):</span>
                                  <div className="flex items-center space-x-2">
                                    {/* If the user has an overtime */}
                                    {overtime === null ? (
                                      minuteDifference > 0 ? (
                                        <Button
                                          type="button"
                                          className="flex items-center"
                                          onClick={handleIsOpenNewOvertime}
                                        >
                                          <>
                                            <span className="font-semibold">
                                              {minuteDifference}
                                            </span>
                                            <HiFire className="h-4 w-4 text-red-500" />
                                          </>

                                          {/* File New Overtime Modal */}
                                          {isOpenNewOvertime ? (
                                            <AddNewOvertimeModal
                                              {...{
                                                isOpen: isOpenNewOvertime,
                                                closeModal: handleIsOpenNewOvertime,
                                                timeEntry,
                                                initialMinutes: minuteDifference
                                              }}
                                            />
                                          ) : null}
                                        </Button>
                                      ) : (
                                        <span className="font-semibold">{NO_OVERTIME}</span>
                                      )
                                    ) : (
                                      <>
                                        {/* If Approved Request */}
                                        {overtime.isLeaderApproved != null &&
                                          overtime.isManagerApproved != null &&
                                          overtime.isLeaderApproved &&
                                          overtime.isManagerApproved && (
                                            <Tippy
                                              placement="left"
                                              content="Approved request"
                                              className="!text-xs"
                                            >
                                              <Button
                                                type="button"
                                                className="inline-flex items-center rounded border-y border-r border-slate-300 group-hover:bg-white"
                                              >
                                                <Check className="h-4 w-5 rounded-l bg-green-500 text-white" />
                                                <span className="px-1 text-green-600">
                                                  {overtime.approvedMinutes}
                                                </span>
                                              </Button>
                                            </Tippy>
                                          )}

                                        {/* If Pending Request */}
                                        {(overtime.isLeaderApproved === null ||
                                          overtime.isManagerApproved === null) && (
                                          <Tippy
                                            placement="left"
                                            content="Pending request"
                                            className="!text-xs"
                                          >
                                            <Button
                                              type="button"
                                              className="inline-flex items-center rounded border-y border-r border-slate-300 group-hover:bg-white"
                                            >
                                              <RefreshCw className="h-4 w-5 rounded-l bg-amber-500 px-1 text-white" />
                                              <span className="px-1 text-amber-600">
                                                {overtime.requestedMinutes}
                                              </span>
                                            </Button>
                                          </Tippy>
                                        )}

                                        {/* If Disapproved Request */}
                                        {overtime.isLeaderApproved !== null &&
                                          overtime.isManagerApproved !== null &&
                                          ((!overtime.isLeaderApproved &&
                                            !overtime.isManagerApproved) ||
                                            (overtime.isLeaderApproved &&
                                              !overtime.isManagerApproved)) && (
                                            <Tippy
                                              placement="left"
                                              content="Disapproved request"
                                              className="!text-xs"
                                            >
                                              <Button
                                                type="button"
                                                className="inline-flex items-center rounded border-y border-r border-slate-300 group-hover:bg-white"
                                              >
                                                <ThumbsDown className="h-4 w-5 rounded-l bg-rose-500 px-1 text-white" />
                                                <span className="px-1 text-rose-600">
                                                  {overtime.requestedMinutes}
                                                </span>
                                              </Button>
                                            </Tippy>
                                          )}
                                      </>
                                    )}
                                  </div>
                                </li>
                                <li className="group flex items-center space-x-2 px-4 py-2">
                                  <span>Actions:</span>
                                  <div
                                    className={classNames(
                                      'inline-flex divide-x divide-slate-300 rounded border',
                                      'border-transparent group-hover:border-slate-300'
                                    )}
                                  >
                                    <Menu as="div" className="relative w-full">
                                      {/* This is for Work Interruption Modal */}
                                      {isOpenTimeEntry ? (
                                        <InterruptionTimeEntriesModal
                                          {...{
                                            isOpen: isOpenTimeEntry,
                                            timeEntryId: timeEntry.id,
                                            user: user?.userById.name as string,
                                            closeModal: handleIsOpenTimeEntryToggle
                                          }}
                                        />
                                      ) : null}

                                      {/* This is for New Offset */}
                                      {isOpenNewOffset ? (
                                        <AddNewOffsetModal
                                          {...{
                                            isOpen: isOpenNewOffset,
                                            closeModal: handleIsOpenNewOffsetToggle,
                                            row: row.original
                                          }}
                                        />
                                      ) : null}

                                      {/* This is for Change Shift Request */}
                                      {isOpenChangeShiftRequest ? (
                                        <ChangeShiftRequestModal
                                          {...{
                                            isOpen: isOpenChangeShiftRequest,
                                            closeModal: handleIsOpenChangeShiftRequestToggle,
                                            timeEntry: row.original
                                          }}
                                        />
                                      ) : null}

                                      {/* This is for Filed Offset Modal */}
                                      {isOpenFiledOffset ? (
                                        <FiledOffsetModal
                                          {...{
                                            isOpen: isOpenFiledOffset,
                                            closeModal: handleIsOpenFiledOffsetToggle,
                                            row: row.original,
                                            isMyDTRPage: true,
                                            query: {
                                              isLoading: false,
                                              isError: false
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <Menu.Button className="p-0.5 text-slate-500 outline-none">
                                        <MoreVertical className="h-4" />
                                      </Menu.Button>
                                      <MenuTransition>
                                        <Menu.Items
                                          className={classNames(
                                            'absolute bottom-7 z-50 flex w-44 flex-col divide-y divide-slate-200 overflow-hidden rounded-md',
                                            'bg-white py-0.5 shadow-xl shadow-slate-200 ring-1 ring-black ring-opacity-5 focus:outline-none'
                                          )}
                                        >
                                          <Menu.Item>
                                            <button
                                              className={menuItemButton}
                                              onClick={() => handleIsOpenTimeEntryToggle(row.id)}
                                            >
                                              <span>Work Interruption</span>
                                            </button>
                                          </Menu.Item>
                                          {user?.userById.position.id ===
                                            USER_POSITIONS.ESL_TEACHER && (
                                            <>
                                              <Menu.Item>
                                                <button
                                                  className={menuItemButton}
                                                  onClick={handleIsOpenNewOffsetToggle}
                                                >
                                                  <span>ESL Change Shift </span>
                                                </button>
                                              </Menu.Item>
                                              <Menu.Item>
                                                <button
                                                  className={menuItemButton}
                                                  onClick={handleIsOpenFiledOffsetToggle}
                                                >
                                                  <span>Filed Offset</span>
                                                </button>
                                              </Menu.Item>
                                            </>
                                          )}
                                          {user?.userById.position.id !==
                                            USER_POSITIONS.ESL_TEACHER && (
                                            <Menu.Item>
                                              <button
                                                className={menuItemButton}
                                                onClick={handleIsOpenChangeShiftRequestToggle}
                                              >
                                                <span>Change Shift Request</span>
                                              </button>
                                            </Menu.Item>
                                          )}
                                        </Menu.Items>
                                      </MenuTransition>
                                    </Menu>
                                  </div>
                                </li>
                              </ul>
                            </Disclosure.Panel>
                          </DisclosureTransition>
                        </motion.div>
                      )}
                    </Disclosure>
                  )
                })}

                {isOpenTimeEntry ? (
                  <InterruptionTimeEntriesModal
                    {...{
                      isOpen: isOpenTimeEntry,
                      timeEntryId,
                      user: user?.userById.name as string,
                      closeModal: handleIsOpenTimeEntryToggle
                    }}
                  />
                ) : null}
              </>
            )}
          </>
        )
      ) : (
        <DiscloseMessage message="Something went wrong" type="error" />
      )}
    </>
  )
}

const DiscloseMessage = ({
  message,
  type = 'default'
}: {
  message: string
  type?: string
}): JSX.Element => {
  return (
    <p
      className={classNames(
        'py-2 text-center font-medium',
        type === 'default' && 'text-slate-500',
        type === 'error' && 'bg-rose-50 text-rose-500'
      )}
    >
      {message}
    </p>
  )
}

export default MobileDisclose
