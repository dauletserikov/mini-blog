import {LockOutlined, UserOutlined} from '@ant-design/icons'
import {Button, Form, Input, Modal} from 'antd'
import styles from './LoginModal.module.css'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {modalToggled} from '../../store/slices/modalsSlice'

export function LoginModal() {
  const [form] = Form.useForm()
  const open = useAppSelector(state => state.modals.login)
  const dispatch = useAppDispatch()

  const onSubmit = () => {
    console.log('submitted')
  }

  return (
    <Modal open={open} onCancel={() => dispatch(modalToggled('login'))} title='Log in' footer={[
      <Button key='submit' type='primary' onClick={form.submit}>
        Submit
      </Button>
    ]}>
      <Form
        name='login'
        onFinish={onSubmit}
        className={styles.form}
        form={form}
      >
        <Form.Item
          name='name'
          rules={[{required: true, message: 'Name cannot be empty'}]}
        >
          <Input prefix={<UserOutlined className='site-form-item-icon' />} placeholder='Name' />
        </Form.Item>
        <Form.Item
          name='password'
          rules={[{required: true, message: 'Password cannot be empty'}]}
        >
          <Input
            prefix={<LockOutlined />}
            type='password'
            placeholder='Password'
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
