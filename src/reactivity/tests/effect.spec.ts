import { reactive } from "../reactive";
import { effect,stop } from "../effect";

describe("effect", () => {
    it("happy path", () => {
      const user = reactive({
        age: 10,
      });
  
      let nextAge;
      effect(() => {
        nextAge = user.age + 1;
      });
  
      expect(nextAge).toBe(11);
  
      // update
      user.age++;
      expect(nextAge).toBe(12);
      expect(user.age).toBe(11)
    });

    it("should return runner when call effect",() => {
        let foo = 1
        const runner = effect(() => {
            foo = 10
            return "foo"
        })

        // expect(foo).toBe(2)
        runner()
        // expect(foo).toBe(3)
        // expect(r).toBe("foo")

        foo--
        // runner()
        expect(foo).toBe(9)
    })

    it.skip('scheduler',() => {
        let dummy
        let run:any

        const scheduler = jest.fn(() =>{
            run = runner
        })
        const obj = reactive({ foo:1 })
        const runner = effect(
            () => {
                dummy = obj.foo
            },
            { scheduler }
        )
        expect(scheduler).not.toHaveBeenCalled()
        obj.foo++
        expect(dummy).toBe(1)
        run()
        expect(dummy).toBe(2)
    })

    it('stop',() => {
        let dummy
        // let nextAge
        const obj = reactive({
            prop:1
        })
        const runner = effect(() => {
            dummy = obj.prop
        })
        
        obj.prop = 2
        expect(dummy).toBe(2)
        // expect(nextAge).toBe(3)
        stop(runner)

        // get
        // set
        obj.prop++
        expect(dummy).toBe(2)
        // expect(nextAge).toBe(4)

        // 重新调用 runner 开始执行
        runner()
        expect(dummy).toBe(3)
    })

    it('onStop',() => {
        const obj = reactive({
            foo:1
        })
        const onStop = jest.fn()
        let dummy
        const runner = effect(
            () => {
                dummy = obj.foo
            },
            {
                onStop
            }
        )

        stop(runner)
        expect(onStop).toBeCalledTimes(1)
    })
});
  