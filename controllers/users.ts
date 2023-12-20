import httpStatus from 'http-status'
import { catchAsync } from '../utils/catchAsync'
import {
  GetUserDTO,
  PostAssessDTO,
  UpdateAssessDTO,
  UpdateUserDTO,
  UserIdDTO,
} from '../models/typeorm/dto/UserDTO'
import userService from '../services/users'
import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/error'
import { User } from '../models/typeorm/entity/User'
import { ResponseDTO } from '../models/typeorm/dto/ResponseDTO'
// import { IUserRequest } from '../config/passport'

export default class UserController {
  static getUser = catchAsync(async (req, res, next) => {
    const dto = new GetUserDTO(req.params.user_id, req.params.type)
    const user_id = Number(req.params.user_id)
    const user = await userService.findOneById(user_id)
    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        '해당 아이디를 가진 유저가 존재하지 않습니다.',
      )
    }
    if (req.params.type === 'info') {
      res.status(httpStatus.OK).json(
        new ResponseDTO(httpStatus.OK, '', {
          user_id: user.id,
          username: user.username,
          email: user.email,
          introduction: user.introduction,
        }),
      )
    } else if (req.params.type === 'detail') {
      const reqUser: any = req.user

      if (!req.isAuthenticated()) {
        throw new ApiError(
          httpStatus.NON_AUTHORITATIVE_INFORMATION,
          '로그인한 사용자만 사용할 수 있습니다.',
        )
      }
      if (reqUser.id !== user_id) {
        throw new ApiError(
          httpStatus.NON_AUTHORITATIVE_INFORMATION,
          '유저 상세정보는 본인 정보만 확인가능합니다.',
        )
      }
      const { socialId, ...rest } = user
      res.status(httpStatus.OK).json(new ResponseDTO(httpStatus.OK, '', rest))
    }
  })
  static updateUser = catchAsync(async (req, res, next) => {
    const dto = new UpdateUserDTO(req.params.user_id, req.body)
    console.log('-->', dto)
    const result = await userService.updateUser(dto)
    res.status(httpStatus.OK).json(new ResponseDTO(httpStatus.OK, '', result))
  })
  static getAssessingList = catchAsync(async (req, res, next) => {
    const userId = Number(req.params.user_id)
    const result = await userService.getAssessingList(userId)
    res.status(httpStatus.OK).json(new ResponseDTO(httpStatus.OK, '', result))
  })
  static getAssessedList = catchAsync(async (req, res, next) => {
    const userId = Number(req.params.user_id)
    const result = await userService.getAssessedList(userId)
    res.status(httpStatus.OK).json(new ResponseDTO(httpStatus.OK, '', result))
  })
  static postAssess = catchAsync(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(httpStatus.BAD_REQUEST, '')
    }
    const user = req.user as any
    const user_id = user.id
    const dto = new PostAssessDTO(user_id, req.body)
    const result = await userService.createAssess(dto)
    res.status(httpStatus.OK).json(new ResponseDTO(httpStatus.OK, '', result))
  })
  static updateAssess = catchAsync(
    async (
      req: Request & { user?: any },
      res: Response,
      next: NextFunction,
    ) => {
      const dto = new UpdateAssessDTO(
        req.params.assess_id,
        req.user.id,
        req.body.score,
        req.body.description,
      )
      const result = await userService.updateAssess(dto)

      res
        .status(httpStatus.OK)
        .json(new ResponseDTO(httpStatus.OK, '수정성공', result))
    },
  )
  static deleteAssess = catchAsync(
    async (req: Request & { user?: any }, res, next) => {
      const userId = Number(req.user.id)
      const assessId = Number(req.params.assess_id)

      await userService.checkIfAssessIsMine(assessId, userId)
      const result = await userService.deleteAssess(assessId)
      res
        .status(httpStatus.OK)
        .json(new ResponseDTO(httpStatus.OK, '삭제성공', result))
    },
  )
}