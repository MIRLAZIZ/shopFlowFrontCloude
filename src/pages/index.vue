<template>
  <div>
    <h1></h1>




    <VBtn>bos</VBtn>
  </div>
</template>

<script setup lang="ts">
definePage({
  meta: {

    action: 'read',
    subject: 'Dashboard',
  },
})

// ref va reactive bu nima ular ni nima farqi bor
// ref va reactive  ikkilsi ham malumotlarni reactive qilish uchun ishlatiladi 
//ref sintacsisi   const count = ref(0) bolsa  count dan count.value sifatida foydalaniladi  template ichida  count deb yozsa bo'ldi value shart emas temlate ni ozini avtamatik unwarap bo'ladi. asoan primative qiymatlar uchun ishlatiladi obyet array uchun ham ishlatsa bo'ladi lekin foydlansh noqulay bo'ladi masalan count2.value.count har bir qiymatga shunday murojat qilinadi  shuninig uchun obyet array va Set uchun reactive qollash kk

// reactive sintaksi   const count = reactive({ count: 0 }) count.contnt deb yoziladi.  asosan objeckt array  Set  uchun ishlatiladi primative uchun ishlatilmaydi ishlatilsa ogolantirish beradi va  reactiv bo'lib ishlamaydi   
const count = ref(5)
const count2 = reactive({ count: 4, oldCount: 0 })
const obj = ref({ name: 'Alisher', age: 22 })
const { name, age } = toRefs(obj.value)

const nameObj = toRef(obj.value, 'name')



</script>
