/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */



// // 👉 Redirects
// export const redirects = [
//   // ℹ️ We are redirecting to different pages based on role.
//   // NOTE: Role is just for UI purposes. ACL is based on abilities.
//   {
//     path: '/',
//     name: 'index',
//     redirect: to => {
//       // TODO: Get type from backend
//       const userData = useCookie('userData')
//       const userRole = userData.value?.role
//       if (userRole === userRole)
//         return { name: 'dashboards-ecommerce' }
//       if (userRole === 'client')
//         return { name: 'dashboards-academy' }

//       return { name: 'login', query: to.query }
//     },
//   },
//   {
//     path: '/pages/user-profile',
//     name: 'pages-user-profile',
//     redirect: () => ({ name: 'pages-user-profile-tab', params: { tab: 'profile' } }),
//   },
//   {
//     path: '/pages/account-settings',
//     name: 'pages-account-settings',
//     redirect: () => ({ name: 'pages-account-settings-tab', params: { tab: 'account' } }),

//   },
// ]


export const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/pages/index.vue'),
    meta: {
      action: 'manageggg',
      subject: 'alljjj',
    },
  },
]

